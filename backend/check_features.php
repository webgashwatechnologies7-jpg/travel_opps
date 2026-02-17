<?php
$features = \App\Models\SubscriptionPlanFeature::all();
foreach ($features as $f) {
    fwrite(STDOUT, $f->key . PHP_EOL);
}
