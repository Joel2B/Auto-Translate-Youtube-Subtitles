<?php

class Utils {
    public function get_url_content(
        $url,
        $data = ''
    ) {
        $user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.72 Safari/537.36';
        $headers    = [
            'Content-Type: application/json',
        ];

        $curl = curl_init();

        $options = [
            CURLOPT_URL            => $url,
            CURLOPT_USERAGENT      => $user_agent,
            CURLOPT_POST           => true,
            CURLOPT_AUTOREFERER    => true,
            CURLOPT_FRESH_CONNECT  => true,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS      => 10,
            CURLOPT_CONNECTTIMEOUT => CONNECTTIMEOUT,
            CURLOPT_TIMEOUT        => TIMEOUT,
            CURLOPT_RETURNTRANSFER => true,
            // for debug only
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_SSL_VERIFYPEER => false,
        ];

        if ($data) {
            $options[CURLOPT_POSTFIELDS] = $data;
        }

        curl_setopt_array($curl, $options);
        $content = curl_exec($curl);
        curl_close($curl);

        return $content;
    }
}
