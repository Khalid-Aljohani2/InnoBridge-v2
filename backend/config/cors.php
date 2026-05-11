<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // غيرنا هذي عشان نقبل أي رابط حالياً ونحل المشكلة فوراً
    'allowed_origins' => ['*'], 

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // خليناها false لأن الـ Bearer Token ما يحتاج credentials معقدة
    'supports_credentials' => false, 
];