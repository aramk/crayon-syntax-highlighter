<?php
require_once ('global.php');
require_once (CRAYON_RESOURCE_PHP);

/* Manages themes once they are loaded. */
class CrayonThemes extends CrayonUsedResourceCollection {
	// Properties and Constants ===============================================

	const DEFAULT_THEME = 'classic';
	const DEFAULT_THEME_NAME = 'Classic';

	private $printed_themes = array();
	
	// Methods ================================================================

	function __construct() {
		$this->directory ( CRAYON_THEME_PATH );
		$this->set_default ( self::DEFAULT_THEME, self::DEFAULT_THEME_NAME );
	}

	// XXX Override
	public function path($id) {
		return CRAYON_THEME_PATH . $id . "/$id.css";
	}
	
	// XXX Override
	public function get_url($id) {
		return CrayonGlobalSettings::plugin_path() . CrayonUtil::pathf(CRAYON_THEME_DIR) . $id . '/' . $id . '.css';
	}
	
}
?>