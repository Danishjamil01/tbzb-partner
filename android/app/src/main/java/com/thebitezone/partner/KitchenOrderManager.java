package com.thebitezone.partner;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Play-Store-Compliant Kitchen Order Alert & Alarm Manager.
 * Uses native USAGE_ALARM MediaPlayer, Vibrator, WakeLock, and High-Priority Heads-Up Notifications
 * without Foreground Service or Full-Screen Intent permissions.
 */
public class KitchenOrderManager {
    private static final String TAG = "KitchenOrderManager";

    public static final String ACTION_STOP_ALARM = "com.thebitezone.partner.ACTION_STOP_ALARM";
    private static final String CHANNEL_URGENT_ID = "tbzb_urgent_orders_v2";
    private static final int URGENT_NOTIFICATION_ID = 2002;

    private static final String PREFS_NAME = "tbzb_kitchen_prefs";
    private static final String PREF_KNOWN_ORDERS = "known_order_ids";

    private static final String FIRESTORE_URL = "https://firestore.googleapis.com/v1/projects/tbzb-bidar/databases/(default)/documents/tbzb_orders?pageSize=25";

    private static KitchenOrderManager instance;

    private final Context appContext;
    private ScheduledExecutorService executorService;
    private MediaPlayer mediaPlayer;
    private Vibrator vibrator;
    private PowerManager.WakeLock wakeLock;

    private final Set<String> acknowledgedOrderIds = Collections.synchronizedSet(new HashSet<>());
    private boolean isFirstFetch = true;
    private volatile boolean isAlertRinging = false;
    private volatile String currentRingingOrderId = null;
    private volatile boolean isPolling = false;

    private KitchenOrderManager(Context context) {
        this.appContext = context.getApplicationContext();
        createNotificationChannel();
        loadKnownOrdersFromPrefs();
    }

    public static synchronized KitchenOrderManager getInstance(Context context) {
        if (instance == null) {
            instance = new KitchenOrderManager(context);
        }
        return instance;
    }

    public boolean isAlarmActive() {
        return isAlertRinging;
    }

    public String getRingingOrderId() {
        return currentRingingOrderId;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = appContext.getSystemService(NotificationManager.class);
            if (nm == null) return;

            Uri soundUri = Uri.parse(
                    ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + appContext.getPackageName() + "/" + R.raw.tbzb_order_alarm
            );

            AudioAttributes audioAttrs = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build();

            NotificationChannel urgentChannel = new NotificationChannel(
                    CHANNEL_URGENT_ID,
                    "Urgent Order Alerts",
                    NotificationManager.IMPORTANCE_HIGH
            );
            urgentChannel.setDescription("Loud siren notifications when a customer places a new order");
            urgentChannel.enableVibration(true);
            urgentChannel.setVibrationPattern(new long[]{0, 800, 400, 800, 400, 800});
            urgentChannel.setSound(soundUri, audioAttrs);
            urgentChannel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            nm.createNotificationChannel(urgentChannel);
        }
    }

    public synchronized void startPolling() {
        if (isPolling) return;
        isPolling = true;

        if (executorService != null && !executorService.isShutdown()) {
            executorService.shutdownNow();
        }
        executorService = Executors.newSingleThreadScheduledExecutor();
        executorService.scheduleWithFixedDelay(this::checkFirestoreOrders, 2, 8, TimeUnit.SECONDS);
        Log.i(TAG, "Kitchen order monitor polling started.");
    }

    public synchronized void stopPolling() {
        isPolling = false;
        if (executorService != null) {
            executorService.shutdownNow();
            executorService = null;
        }
    }

    private void checkFirestoreOrders() {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(FIRESTORE_URL);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(6000);
            conn.setReadTimeout(6000);
            conn.setUseCaches(false);

            if (conn.getResponseCode() == 200) {
                BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
                reader.close();
                processFirestoreResponse(sb.toString());
            }
        } catch (Exception e) {
            Log.w(TAG, "Order check skipped: " + e.getMessage());
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    private void processFirestoreResponse(String jsonString) {
        try {
            JSONObject root = new JSONObject(jsonString);
            if (!root.has("documents")) return;

            JSONArray docs = root.getJSONArray("documents");
            for (int i = 0; i < docs.length(); i++) {
                JSONObject doc = docs.getJSONObject(i);
                if (!doc.has("fields")) continue;

                JSONObject fields = doc.getJSONObject("fields");
                String orderId = "";
                if (fields.has("orderId") && fields.getJSONObject("orderId").has("stringValue")) {
                    orderId = fields.getJSONObject("orderId").getString("stringValue");
                }
                if (orderId.isEmpty() && doc.has("name")) {
                    String name = doc.getString("name");
                    orderId = name.substring(name.lastIndexOf('/') + 1);
                }
                if (orderId.isEmpty()) continue;

                String status = "";
                if (fields.has("status") && fields.getJSONObject("status").has("stringValue")) {
                    status = fields.getJSONObject("status").getString("stringValue");
                }

                if (isFirstFetch) {
                    // Learn existing orders unless currently 'new' -> let Angular decide on initial open
                    acknowledgedOrderIds.add(orderId);
                    continue;
                }

                if ("new".equalsIgnoreCase(status) && !acknowledgedOrderIds.contains(orderId)) {
                    String customer = "Customer";
                    if (fields.has("customerName") && fields.getJSONObject("customerName").has("stringValue")) {
                        customer = fields.getJSONObject("customerName").getString("stringValue");
                    }
                    String total = "0";
                    if (fields.has("total")) {
                        JSONObject totalObj = fields.getJSONObject("total");
                        total = totalObj.optString("integerValue", totalObj.optString("doubleValue", "0"));
                    }
                    String locality = "Bidar";
                    if (fields.has("areaLocality") && fields.getJSONObject("areaLocality").has("stringValue")) {
                        locality = fields.getJSONObject("areaLocality").getString("stringValue");
                    }

                    triggerUrgentOrderAlarm(orderId, customer, total, locality, false);
                    break;
                }
            }

            if (isFirstFetch) {
                isFirstFetch = false;
                saveKnownOrdersToPrefs();
            }
        } catch (Exception e) {
            Log.e(TAG, "Error parsing Firestore orders: " + e.getMessage());
        }
    }

    public synchronized void triggerUrgentOrderAlarm(String orderId, String customer, String total, String locality, boolean forceIfUnacked) {
        if (orderId == null || orderId.isEmpty()) return;
        if (isAlertRinging && orderId.equals(currentRingingOrderId)) return;
        if (!forceIfUnacked && acknowledgedOrderIds.contains(orderId)) return;

        acknowledgedOrderIds.add(orderId);
        saveKnownOrdersToPrefs();

        isAlertRinging = true;
        currentRingingOrderId = orderId;

        wakeScreenBriefly();
        playContinuousSiren();
        startVibration();
        showHeadsUpNotification(orderId, customer, total, locality);
    }

    public synchronized void acknowledgeOrder(String orderId) {
        if (orderId != null && !orderId.isEmpty()) {
            acknowledgedOrderIds.add(orderId);
            saveKnownOrdersToPrefs();
            if (orderId.equals(currentRingingOrderId)) {
                stopUrgentAlarm();
            }
        }
    }

    private void showHeadsUpNotification(String orderId, String customer, String total, String locality) {
        try {
            Intent openAppIntent = new Intent(appContext, MainActivity.class);
            openAppIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            openAppIntent.putExtra("from_order_alert", true);
            openAppIntent.putExtra("ringingOrderId", orderId);

            int pendingFlags = PendingIntent.FLAG_UPDATE_CURRENT |
                    (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0);

            PendingIntent openPendingIntent = PendingIntent.getActivity(
                    appContext, orderId.hashCode(), openAppIntent, pendingFlags
            );

            Intent stopIntent = new Intent(appContext, AlarmStopReceiver.class);
            stopIntent.setAction(ACTION_STOP_ALARM);
            PendingIntent stopPendingIntent = PendingIntent.getBroadcast(
                    appContext, orderId.hashCode() + 1, stopIntent, pendingFlags
            );

            String safeCustomer = (customer != null && !customer.isEmpty()) ? customer : "Customer";
            String safeTotal = (total != null && !total.isEmpty()) ? total : "0";
            String safeLocality = (locality != null && !locality.isEmpty()) ? locality : "Bidar";

            NotificationCompat.Builder builder = new NotificationCompat.Builder(appContext, CHANNEL_URGENT_ID)
                    .setSmallIcon(R.mipmap.ic_launcher)
                    .setContentTitle("🚨 NEW FOOD ORDER: #" + orderId)
                    .setContentText(safeCustomer + " • ₹" + safeTotal + " (" + safeLocality + ")")
                    .setStyle(new NotificationCompat.BigTextStyle().bigText(
                            "New incoming order from " + safeCustomer + " (" + safeLocality + "). Total: ₹" + safeTotal + ".\nTap to accept and start preparing."
                    ))
                    .setPriority(NotificationCompat.PRIORITY_MAX)
                    .setCategory(NotificationCompat.CATEGORY_ALARM)
                    .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                    .setContentIntent(openPendingIntent)
                    .setAutoCancel(true)
                    .addAction(android.R.drawable.ic_menu_view, "ACCEPT ORDER", openPendingIntent)
                    .addAction(android.R.drawable.ic_delete, "STOP SIREN", stopPendingIntent);

            NotificationManagerCompat.from(appContext).notify(URGENT_NOTIFICATION_ID, builder.build());
        } catch (SecurityException se) {
            Log.w(TAG, "Notification permission not granted yet.");
        } catch (Exception e) {
            Log.w(TAG, "Could not show notification: " + e.getMessage());
        }
    }

    @SuppressWarnings("deprecation")
    private void wakeScreenBriefly() {
        try {
            PowerManager pm = (PowerManager) appContext.getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                if (wakeLock != null && wakeLock.isHeld()) {
                    wakeLock.release();
                }
                wakeLock = pm.newWakeLock(
                        PowerManager.SCREEN_BRIGHT_WAKE_LOCK |
                        PowerManager.ACQUIRE_CAUSES_WAKEUP |
                        PowerManager.ON_AFTER_RELEASE,
                        "TBZB:OrderAlertWakeup"
                );
                wakeLock.acquire(10000);
            }
        } catch (Exception ignored) {}
    }

    private void playContinuousSiren() {
        try {
            stopAudio();

            Uri alarmUri = Uri.parse(
                    ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + appContext.getPackageName() + "/" + R.raw.tbzb_order_alarm
            );

            mediaPlayer = new MediaPlayer();
            mediaPlayer.setDataSource(appContext, alarmUri);
            mediaPlayer.setAudioAttributes(
                    new AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_ALARM)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build()
            );
            mediaPlayer.setLooping(true);
            mediaPlayer.prepare();
            mediaPlayer.start();
        } catch (Exception e) {
            try {
                Uri fallbackUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
                if (fallbackUri == null) fallbackUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
                mediaPlayer = new MediaPlayer();
                mediaPlayer.setDataSource(appContext, fallbackUri);
                mediaPlayer.setAudioAttributes(
                        new AudioAttributes.Builder()
                                .setUsage(AudioAttributes.USAGE_ALARM)
                                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                                .build()
                );
                mediaPlayer.setLooping(true);
                mediaPlayer.prepare();
                mediaPlayer.start();
            } catch (Exception ignored) {}
        }
    }

    @SuppressWarnings("deprecation")
    private void startVibration() {
        try {
            vibrator = (Vibrator) appContext.getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null && vibrator.hasVibrator()) {
                long[] pattern = {0, 800, 400, 800, 400, 800};
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0));
                } else {
                    vibrator.vibrate(pattern, 0);
                }
            }
        } catch (Exception ignored) {}
    }

    public synchronized void stopUrgentAlarm() {
        isAlertRinging = false;
        currentRingingOrderId = null;

        stopAudio();

        if (vibrator != null) {
            try {
                vibrator.cancel();
            } catch (Exception ignored) {}
            vibrator = null;
        }

        if (wakeLock != null && wakeLock.isHeld()) {
            try {
                wakeLock.release();
            } catch (Exception ignored) {}
            wakeLock = null;
        }

        try {
            NotificationManagerCompat.from(appContext).cancel(URGENT_NOTIFICATION_ID);
        } catch (Exception ignored) {}
    }

    private void stopAudio() {
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) mediaPlayer.stop();
                mediaPlayer.release();
            } catch (Exception ignored) {}
            mediaPlayer = null;
        }
    }

    private void loadKnownOrdersFromPrefs() {
        try {
            SharedPreferences prefs = appContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            Set<String> saved = prefs.getStringSet(PREF_KNOWN_ORDERS, null);
            if (saved != null) {
                acknowledgedOrderIds.addAll(saved);
            }
        } catch (Exception ignored) {}
    }

    private void saveKnownOrdersToPrefs() {
        try {
            SharedPreferences prefs = appContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putStringSet(PREF_KNOWN_ORDERS, new HashSet<>(acknowledgedOrderIds)).apply();
        } catch (Exception ignored) {}
    }
}

