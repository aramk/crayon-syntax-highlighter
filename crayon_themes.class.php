<?php
require_once ('global.php');
require_once (CRAYON_RESOURCE_PHP);

/* Manages themes once they are loaded. */
class CrayonThemes extends CrayonUserResourceCollection {
    // Properties and Constants ===============================================

    const DEFAULT_THEME = 'classic';
    const DEFAULT_THEME_NAME = 'Classic';
    const CSS_PREFIX = '.crayon-theme-';

    private $printed_themes = array();

    // Methods ================================================================

    function __construct() {
        $this->directory(CRAYON_THEME_PATH);
        CrayonLog::debug("Setting theme directories");
        $upload = CrayonGlobalSettings::upload_path();
        if ($upload) {
            $this->user_directory($upload . CRAYON_THEME_DIR);
            if (!is_dir($this->user_directory())) {
                CrayonGlobalSettings::mkdir($this->user_directory());
                CrayonLog::debug($this->user_directory(), "THEME DIR");
            }
        } else {
            CrayonLog::syslog("Upload directory is empty: " . $upload);
        }
        CrayonLog::debug($this->directory());
        CrayonLog::debug($this->user_directory());
		$this->set_default(self::DEFAULT_THEME, self::DEFAULT_THEME_NAME);
	}

    // XXX Override
    public function path($id, $user = NULL) {
        return $this->dirpath($id, $user) . "$id.css";
    }

    public function dirpath($id, $user = NULL) {
        $path = NULL;
        if ($user === NULL) {
            if ($this->is_state_loading()) {
                // We seem to be loading resources - use current directory
                $user = $this->current_directory() == $this->user_directory();
            } else {
                $theme = $this->get($id);
                if ($theme) {
                    $user = $theme->user();
                } else {
                    $user = FALSE;
                }
            }
        }
        $path = $user ? $this->user_directory() : $this->directory();
        return CrayonUtil::path_slash($path . $id);
    }

    // XXX Override
    public function get_url($id, $user = NULL) {
        if ($user === NULL) {
            if ($this->is_state_loading()) {
                // We seem to be loading resources - use current directory
                $user = $this->current_directory() == $this->user_directory();
            } else {
                $theme = $this->get($id);
                if ($theme) {
                    $user = $theme->user();
                } else {
                    $user = FALSE;
                }
            }
        }
        return self::dir_url($user) . $id . '/' . $id . '.css';
    }

    public static function dir_url($user = FALSE) {
        $path = $user ? CrayonGlobalSettings::upload_url() : CrayonGlobalSettings::plugin_path();
        return $path . CrayonUtil::pathf(CRAYON_THEME_DIR);
    }

}

?>