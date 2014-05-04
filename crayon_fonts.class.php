<?php
require_once ('global.php');
require_once (CRAYON_RESOURCE_PHP);

/* Manages fonts once they are loaded. */
class CrayonFonts extends CrayonUserResourceCollection {
	// Properties and Constants ===============================================

	const DEFAULT_FONT = 'monaco';
	const DEFAULT_FONT_NAME = 'Monaco';

	// Methods ================================================================

	function __construct() {
		$this->set_default(self::DEFAULT_FONT, self::DEFAULT_FONT_NAME);
        $this->directory(CRAYON_FONT_PATH);
        $this->relative_directory(CRAYON_FONT_DIR);
        $this->extension('css');

        CrayonLog::debug("Setting font directories");
        $upload = CrayonGlobalSettings::upload_path();
        if ($upload) {
            $this->user_directory($upload . CRAYON_FONT_DIR);
            if (!is_dir($this->user_directory())) {
                CrayonGlobalSettings::mkdir($this->user_directory());
                CrayonLog::debug($this->user_directory(), "FONT USER DIR");
            }
        } else {
            CrayonLog::syslog("Upload directory is empty: " . $upload . " cannot load fonts.");
        }
        CrayonLog::debug($this->directory());
        CrayonLog::debug($this->user_directory());
	}

}
?>