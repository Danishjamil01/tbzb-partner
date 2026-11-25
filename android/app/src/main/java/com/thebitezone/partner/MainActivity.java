package com.thebitezone.partner;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(KitchenAlarmPlugin.class);
        super.onCreate(savedInstanceState);

        // Keep screen awake while Partner Dashboard is open on the kitchen counter
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // Start Play-Store-compliant native order alert & polling manager
        KitchenOrderManager.getInstance(this).startPolling();

        // Request standard Notification permission on Android 13+ (API 33+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 101);
            }
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (intent != null && intent.getBooleanExtra("from_order_alert", false)) {
            KitchenOrderManager.getInstance(this).stopUrgentAlarm();
        }
    }

    @Override
    public void onDestroy() {
        KitchenOrderManager.getInstance(this).stopUrgentAlarm();
        KitchenOrderManager.getInstance(this).stopPolling();
        super.onDestroy();
    }
}
