<?php
require_once ('global.php');
require_once (CRAYON_RESOURCE_PHP);

/* Manages fonts once they are loaded. */
class CrayonFonts extends CrayonUsedResourceCollection {
	// Properties and Constants ===============================================

	const DEFAULT_FONT = 'monaco';
	const DEFAULT_FONT_NAME = 'Monaco';

	// Methods ================================================================

	function __construct() {
		$this->set_default(self::DEFAULT_FONT, self::DEFAULT_FONT_NAME);
		$this->directory(CRAYON_FONT_PATH);
	}

	// XXX Override
	public function path($id) {
		return CRAYON_FONT_PATH . "$id.css";
	}

//	// XXX Override
//	public function load_process() {
//		if (!$this->is_state_loading()) {
//			return;
//		}
//		$this->load_resources();
//		$default = $this->resource_instance(self::DEFAULT_FONT, self::DEFAULT_FONT_NAME);
//		// If some idiot puts a font with the default font name, this will replace it
//
//		$this->add(self::DEFAULT_FONT, $default);
//	}
	
	// XXX Override
	public function get_url($id) {
		return CrayonGlobalSettings::plugin_path() . CrayonUtil::pathf(CRAYON_FONT_DIR) . $id . '.css';
	}
}
?>