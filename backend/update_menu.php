<?php
use App\Models\Setting;

$settings = Setting::where('key', 'like', '%sidebar_menu%')->get();

foreach ($settings as $setting) {
    if ($setting->value) {
        $menu = json_decode($setting->value, true);
        if (is_array($menu)) {
            $hasNotif = false;
            foreach ($menu as $item) {
                if (isset($item['path']) && $item['path'] === '/notifications') {
                    $hasNotif = true;
                    break;
                }
            }
            if (!$hasNotif) {
                array_splice($menu, 1, 0, [['path' => '/notifications', 'label' => 'Notifications', 'icon' => 'Bell']]);
                $setting->value = json_encode($menu);
                $setting->save();
                echo "Updated " . $setting->key . "\n";
            }
        }
    }
}
echo "Done.\n";
