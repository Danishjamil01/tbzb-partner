package com.thebitezone.partner;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * Handles the "STOP SIREN" button inside the high-priority order notification.
 */
public class AlarmStopReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent != null && KitchenOrderManager.ACTION_STOP_ALARM.equals(intent.getAction())) {
            KitchenOrderManager.getInstance(context).stopUrgentAlarm();
        }
    }
}

