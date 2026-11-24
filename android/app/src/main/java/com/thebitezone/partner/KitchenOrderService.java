package com.thebitezone.partner;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

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
 * TBZB Background Kitchen Monitor & Urgent Order Siren Service
 * Keeps kitchen online, checks Firestore for new incoming orders,
 * wakes the screen, and sounds continuous restaurant alert siren.
 */
public class KitchenOrderService extends Service {
    private static final String TAG = "KitchenOrderService";

    public static final String ACTION_START = "com.thebitezone.partner.ACTION_START";
    public static final String ACTION_STOP = "com.thebitezone.partner.ACTION_STOP";
    public static final String ACTION_STOP_ALARM = "com.thebitezone.partner.ACTION_STOP_ALARM";

    private static final String CHANNEL_MONITOR_ID = "tbzb_kitchen_monitor";
    private static final String CHANNEL_URGENT_ID = "tbzb_urgent_orders";

    private static final int MONITOR_NOTIFICATION_ID = 1001;
    private static final int URGENT_NOTIFICATION_ID = 2002;

    private static final String PREFS_NAME = "tbzb_kitchen_prefs";
    private static final String PREF_KNOWN_ORDERS = "known_order_ids";

    private static final String FIRESTORE_URL = "https://firestore.googleapis.com/v1/projects/tbzb-bidar/databases/(default)/documents/tbzb_orders?pageSize=25";

    private static boolean isServiceRunning = false;
    private static boolean isAlertRinging = false;
    private static String currentRingingOrderId = null;

    private ScheduledExecutorService executorService;
    private MediaPlayer mediaPlayer;
    private Vibrator vibrator;
    private PowerManager.WakeLock wakeLock;

    private final Set<String> knownOrderIds = Collections.synchronizedSet(new HashSet<>());
    private boolean isFirstFetch = true;

    public static boolean isRunning() {
        return isServiceRunning;
    }

    public static boolean isAlarmActive() {
        return isAlertRinging;
    }

    public static String getRingingOrderId() {
        return currentRingingOrderId;
    }

    public static void start(Context context) {
        Intent intent = new Intent(context, KitchenOrderService.class);
        intent.setAction(ACTION_START);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            ContextCompat.startForegroundService(context, intent);
        } else {
            context.startService(intent);
        }
    }

    public static void stopAlarm(Context context) {
        Intent intent = new Intent(context, KitchenOrderService.class);
        intent.setAction(ACTION_STOP_ALARM);
        context.startService(intent);
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannels();
        loadKnownOrdersFromPrefs();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : ACTION_START;

        if (ACTION_STOP.equals(action)) {
            stopMonitoring();
            stopSelf();
            return START_NOT_STICKY;
        }

        if (ACTION_STOP_ALARM.equals(action)) {
            stopUrgentAlarm();
            return START_STICKY;
        }

        // Default or ACTION_START: Start foreground monitoring
        if (!isServiceRunning) {
            startForegroundMonitoring();
        }

        return START_STICKY;
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm == null) return;

            // 1. Monitor Channel (Silent, Persistent)
            NotificationChannel monitorChannel = new NotificationChannel(
                    CHANNEL_MONITOR_ID,
                    "Kitchen Order Monitor",
                    NotificationManager.IMPORTANCE_LOW
            );
            monitorChannel.setDescription("Keeps TBZB Partner online to receive orders");
            monitorChannel.setShowBadge(false);
            nm.createNotificationChannel(monitorChannel);

            // 2. Urgent Alert Channel (High Importance, Siren, Full Screen)
            NotificationChannel urgentChannel = new NotificationChannel(
                    CHANNEL_URGENT_ID,
                    "Urgent Order Alerts",
                    NotificationManager.IMPORTANCE_HIGH
            );
            urgentChannel.setDescription("Piercing alarm alert when a customer places an order");
            urgentChannel.enableVibration(true);
            urgentChannel.setVibrationPattern(new long[]{0, 800, 400, 800, 400, 800});
            urgentChannel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            nm.createNotificationChannel(urgentChannel);
        }
    }

    private void startForegroundMonitoring() {
        isServiceRunning = true;

        Intent launchIntent = new Intent(this, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                0,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_MONITOR_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle("TBZB Kitchen Online 🟢")
                .setContentText("Monitoring live customer orders in Bidar...")
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(MONITOR_NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
        } else {
            startForeground(MONITOR_NOTIFICATION_ID, notification);
        }

        // Schedule polling every 6 seconds
        if (executorService != null && !executorService.isShutdown()) {
            executorService.shutdownNow();
        }
        executorService = Executors.newSingleThreadScheduledExecutor();
        executorService.scheduleWithFixedDelay(this::checkFirestoreOrders, 1, 6, TimeUnit.SECONDS);

        Log.i(TAG, "TBZB Kitchen Order Monitor started in foreground.");
    }

    private void stopMonitoring() {
        isServiceRunning = false;
        if (executorService != null) {
            executorService.shutdownNow();
            executorService = null;
        }
        stopUrgentAlarm();
        stopForeground(true);
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

            int responseCode = conn.getResponseCode();
            if (responseCode == 200) {
                BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
                reader.close();

                processFirestoreResponse(sb.toString());
            } else {
                Log.w(TAG, "Firestore HTTP error: " + responseCode);
            }
        } catch (Exception e) {
            Log.w(TAG, "Error checking Firestore orders: " + e.getMessage());
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
        }
    }

    private void processFirestoreResponse(String jsonString) {
        try {
            JSONObject root = new JSONObject(jsonString);
            if (!root.has("documents")) return;

            JSONArray docs = root.getJSONArray("documents");
            Set<String> currentIds = new HashSet<>();

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

                currentIds.add(orderId);

                String status = "";
                if (fields.has("status") && fields.getJSONObject("status").has("stringValue")) {
                    status = fields.getJSONObject("status").getString("stringValue");
                }

                // If this is the very first fetch on startup, just learn all existing orders without ringing
                if (isFirstFetch) {
                    knownOrderIds.add(orderId);
                    continue;
                }

                // If an order is in 'new' status and we haven't acknowledged it yet
                if ("new".equalsIgnoreCase(status) && !knownOrderIds.contains(orderId)) {
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

                    Log.i(TAG, "🚨 NEW INCOMING ORDER DETECTED: #" + orderId + " by " + customer + " (₹" + total + ")");
                    knownOrderIds.add(orderId);
                    saveKnownOrdersToPrefs();

                    triggerUrgentOrderAlarm(orderId, customer, total, locality);
                    break;
                }
            }

            if (isFirstFetch) {
                isFirstFetch = false;
                saveKnownOrdersToPrefs();
                Log.i(TAG, "Initial Firestore snapshot loaded with " + knownOrderIds.size() + " orders.");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error parsing Firestore orders: " + e.getMessage(), e);
        }
    }

    /**
     * Wakes screen, rings siren, vibrates continuously, and opens app.
     */
    private synchronized void triggerUrgentOrderAlarm(String orderId, String customer, String total, String locality) {
        isAlertRinging = true;
        currentRingingOrderId = orderId;

        // 1. Wake Screen & Keep on
        wakeUpPhoneScreen();

        // 2. Play continuous Siren Sound (USAGE_ALARM)
        playContinuousSiren();

        // 3. Continuous Vibration
        startVibration();

        // 4. Build Full Screen Intent Notification
        Intent openAppIntent = new Intent(this, MainActivity.class);
        openAppIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        openAppIntent.putExtra("from_order_alert", true);
        openAppIntent.putExtra("ringingOrderId", orderId);

        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(
                this,
                orderId.hashCode(),
                openAppIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        Intent stopIntent = new Intent(this, KitchenOrderService.class);
        stopIntent.setAction(ACTION_STOP_ALARM);
        PendingIntent stopPendingIntent = PendingIntent.getService(
                this,
                orderId.hashCode() + 1,
                stopIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        NotificationCompat.Builder alertBuilder = new NotificationCompat.Builder(this, CHANNEL_URGENT_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle("🚨 NEW FOOD ORDER: #" + orderId)
                .setContentText(customer + " • ₹" + total + " (" + locality + ")")
                .setStyle(new NotificationCompat.BigTextStyle().bigText(
                        "New incoming food order from " + customer + " (" + locality + "). Total Amount: ₹" + total + ".\nTap to accept and start preparing."
                ))
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setFullScreenIntent(fullScreenPendingIntent, true)
                .setContentIntent(fullScreenPendingIntent)
                .setAutoCancel(false)
                .setOngoing(true)
                .addAction(android.R.drawable.ic_menu_view, "ACCEPT ORDER", fullScreenPendingIntent)
                .addAction(android.R.drawable.ic_delete, "STOP SIREN", stopPendingIntent);

        NotificationManagerCompat.from(this).notify(URGENT_NOTIFICATION_ID, alertBuilder.build());

        // 5. Bring Activity directly to foreground
        try {
            startActivity(openAppIntent);
        } catch (Exception e) {
            Log.w(TAG, "Direct activity launch error: " + e.getMessage());
        }
    }

    private void wakeUpPhoneScreen() {
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
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
                wakeLock.acquire(20000); // 20 seconds bright screen
            }
        } catch (Exception e) {
            Log.w(TAG, "WakeLock error: " + e.getMessage());
        }
    }

    private void playContinuousSiren() {
        try {
            stopAudio();

            // Try raw resource WAV first
            int rawId = getResources().getIdentifier("tbzb_order_alarm", "raw", getPackageName());
            if (rawId != 0) {
                mediaPlayer = MediaPlayer.create(this, rawId);
            }

            // Fallback to default alarm ringtone if rawId is 0 or failed
            if (mediaPlayer == null) {
                Uri alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
                if (alarmUri == null) {
                    alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
                }
                mediaPlayer = new MediaPlayer();
                mediaPlayer.setDataSource(this, alarmUri);
                mediaPlayer.setAudioAttributes(
                        new AudioAttributes.Builder()
                                .setUsage(AudioAttributes.USAGE_ALARM)
                                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                                .build()
                );
                mediaPlayer.prepare();
            }

            if (mediaPlayer != null) {
                mediaPlayer.setLooping(true);
                mediaPlayer.start();
                Log.i(TAG, "Continuous alarm siren playing.");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error playing siren: " + e.getMessage(), e);
        }
    }

    private void startVibration() {
        try {
            vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null && vibrator.hasVibrator()) {
                long[] pattern = {0, 800, 400, 800, 400, 800};
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0)); // 0 repeats
                } else {
                    vibrator.vibrate(pattern, 0);
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Vibration error: " + e.getMessage());
        }
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

        NotificationManagerCompat.from(this).cancel(URGENT_NOTIFICATION_ID);
        Log.i(TAG, "Urgent order siren stopped.");
    }

    private void stopAudio() {
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
                mediaPlayer.release();
            } catch (Exception ignored) {}
            mediaPlayer = null;
        }
    }

    private void loadKnownOrdersFromPrefs() {
        try {
            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
            Set<String> saved = prefs.getStringSet(PREF_KNOWN_ORDERS, null);
            if (saved != null) {
                knownOrderIds.addAll(saved);
            }
        } catch (Exception e) {
            Log.w(TAG, "Could not load known orders from prefs: " + e.getMessage());
        }
    }

    private void saveKnownOrdersToPrefs() {
        try {
            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
            prefs.edit().putStringSet(PREF_KNOWN_ORDERS, new HashSet<>(knownOrderIds)).apply();
        } catch (Exception e) {
            Log.w(TAG, "Could not save known orders to prefs: " + e.getMessage());
        }
    }

    @Override
    public void onDestroy() {
        stopMonitoring();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
