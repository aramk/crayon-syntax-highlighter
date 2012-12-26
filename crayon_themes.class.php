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
//        var_dump('__construct');

		$this->directory ( CRAYON_THEME_PATH );
        $this->user_directory(CrayonGlobalSettings::upload_path() . CRAYON_THEME_DIR);
        if (!is_dir($this->user_directory())) {
            mkdir($this->user_directory(), 0777, TRUE);
        }
		$this->set_default ( self::DEFAULT_THEME, self::DEFAULT_THEME_NAME );

//        var_dump($this->directory());
//        var_dump($this->user_directory());
	}

//    public function exists($id) {
//        var_dump($id);
//        var_dump(parent::exists($id));
//    }

	// XXX Override
	public function path($id) {
//        var_dump($this->dirpath($id) . "/$id.css");
		return $this->dirpath($id) . "/$id.css";
	}

//    public function add_resource($resource) {
//        var_dump($resource);
//    }

    public function dirpath($id) {
        $theme = $this->get($id);
        if ($theme) {
            $path = $theme->user() ? $this->user_directory() : $this->directory();
        } else {
            // We seem to be loading resources - use current directory
            $path = $this->current_directory();
        }
        if ($path) {
            return $path . $id;
        } else {
            return NULL;
        }
    }

	// XXX Override
	public function get_url($id) {
        // XXX This should only be called once the theme has been loaded as a resource
        $theme = $this->get($id);
        if ($theme) {
            return self::dir_url($theme->user()) . $id . '/' . $id . '.css';
        } else {
            return NULL;
        }
	}

    public static function dir_url($user = FALSE) {
        $path = $user ? CrayonGlobalSettings::upload_url() : CrayonGlobalSettings::plugin_path();
        return $path . CrayonUtil::pathf(CRAYON_THEME_DIR);
    }

}
?>