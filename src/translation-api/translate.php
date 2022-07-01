<?php

include 'utils.php';

class Translate extends Utils {
    private $source_language;
    private $target_language;
    private $word;
    private $server;
    private $translation = [];

    public function __construct() {
        if (
            !isset($_POST['targetLanguage']) || empty($_POST['targetLanguage']) ||
            !isset($_POST['word']) || empty($_POST['word']) ||
            !isset($_POST['server']) || empty($_POST['server'])
        ) {
            return;
        }

        $this->source_language =
        isset($_POST['sourceLanguage']) && !empty($_POST['sourceLanguage'])
            ? $_POST['sourceLanguage']
            : 'auto';
        $this->target_language = $_POST['targetLanguage'];
        $this->word            = $_POST['word'];
        $this->server          = $_POST['server'];

        $this->select_server();
    }

    public function select_server() {
        switch ($this->server) {
            case 'google-translate':
                $this->google_translate();
                break;
            case 'deepl':
                $this->deepl();
                break;
            default:
                $this->deepl();
                break;
        }
    }

    public function google_translate() {
        $url         = "https://translate.googleapis.com/translate_a/single?client=gtx&sl={$this->source_language}&tl={$this->target_language}&hl={$this->target_language}&dt=t&dt=bd&dj=1&source=input&q={$this->word}";
        $data        = $this->get_url_content($url);
        $parsed_data = json_decode($data, true);

        if (!isset($parsed_data['sentences'][0]['trans'])) {
            return;
        }

        $this->translation['origin'] = $this->word;
        $this->translation['trans']  = $parsed_data['sentences'][0]['trans'];
        $this->translation['dict']   = isset($parsed_data['dict']) ? $parsed_data['dict'] : '';
    }

    public function deepl() {
        $data = [
            'impressionId'   => '5f51c7de-3a34-4918-8760-3da501e45857',
            'text'           => $this->word,
            'targetLanguage' => $this->target_language,
        ];

        if ($this->source_language != 'auto') {
            $data['sourceLanguage'] = $this->source_language;
        }

        $url         = "https://api.pons.com/text-translation-web/v4/translate?locale=en";
        $data        = $this->get_url_content($url, json_encode($data));
        $parsed_data = json_decode($data, true);

        if (!isset($parsed_data['text'])) {
            return;
        }

        $this->translation['origin']         = $this->word;
        $this->translation['trans']          = $parsed_data['text'];
        $this->translation['serviceMessage'] = $parsed_data['serviceMessage'];
    }

    public function json() {
        return json_encode($this->translation);
    }
}
