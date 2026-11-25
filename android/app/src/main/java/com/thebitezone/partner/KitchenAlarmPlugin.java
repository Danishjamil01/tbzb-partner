package com.thebitezone.partner;

import android.app.Activity;
import android.view.WindowManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "KitchenAlarm")
public class KitchenAlarmPlugin extends Plugin {

    @PluginMethod
    public void startMonitor(PluginCall call) {
        KitchenOrderManager.getInstance(getContext()).startPolling();

        Activity activity = getActivity();
        if (activity != null) {
            activity.runOnUiThread(() ->
                activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            );
        }

        JSObject ret = new JSObject();
        ret.put("started", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void triggerAlert(PluginCall call) {
        String orderId = call.getString("orderId", "");
        String customer = call.getString("customer", "Customer");
        String total = call.getString("total", "0");
        String locality = call.getString("locality", "Bidar");

        if (!orderId.isEmpty()) {
            KitchenOrderManager.getInstance(getContext())
                    .triggerUrgentOrderAlarm(orderId, customer, total, locality, true);
        }

        JSObject ret = new JSObject();
        ret.put("triggered", !orderId.isEmpty());
        call.resolve(ret);
    }

    @PluginMethod
    public void stopAlarm(PluginCall call) {
        KitchenOrderManager.getInstance(getContext()).stopUrgentAlarm();
        JSObject ret = new JSObject();
        ret.put("stopped", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void acknowledgeOrder(PluginCall call) {
        String orderId = call.getString("orderId", "");
        if (!orderId.isEmpty()) {
            KitchenOrderManager.getInstance(getContext()).acknowledgeOrder(orderId);
        }
        JSObject ret = new JSObject();
        ret.put("acknowledged", !orderId.isEmpty());
        call.resolve(ret);
    }

    @PluginMethod
    public void isAlarmRinging(PluginCall call) {
        KitchenOrderManager manager = KitchenOrderManager.getInstance(getContext());
        JSObject ret = new JSObject();
        ret.put("isRinging", manager.isAlarmActive());
        ret.put("orderId", manager.getRingingOrderId());
        call.resolve(ret);
    }
}
