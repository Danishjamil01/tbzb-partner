package com.thebitezone.partner;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "KitchenAlarm")
public class KitchenAlarmPlugin extends Plugin {

    @PluginMethod
    public void startMonitor(PluginCall call) {
        KitchenOrderService.start(getContext());
        JSObject ret = new JSObject();
        ret.put("started", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void stopAlarm(PluginCall call) {
        KitchenOrderService.stopAlarm(getContext());
        JSObject ret = new JSObject();
        ret.put("stopped", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void isAlarmRinging(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("isRinging", KitchenOrderService.isAlarmActive());
        ret.put("orderId", KitchenOrderService.getRingingOrderId());
        call.resolve(ret);
    }
}
