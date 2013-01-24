<?php
require_once (CRAYON_ROOT_PATH . 'crayon_settings.class.php');

/* Manages logging variable values to the log file. */
class CrayonLog {
	private static $file = NULL;

	// Logs a variable value to a log file

	public static function log($var = NULL, $title = '', $trim_url = TRUE) {
		if ($var === NULL) {
			// Return log

			if (($log = CrayonUtil::file(CRAYON_LOG_FILE)) !== FALSE) {
				return $log;
			} else {
				return '';
			}
		} else {
			try {
				if (self::$file == NULL) {
					self::$file = @fopen(CRAYON_LOG_FILE, 'a+');

					if (self::$file) {
						$header = /*CRAYON_DASH .*/ CRAYON_NL . '[Crayon Syntax Highlighter Log Entry - ' . date('g:i:s A - d M Y') . ']' . CRAYON_NL .
							/*CRAYON_DASH .*/ CRAYON_NL;
						fwrite(self::$file, $header);
					} else {
						return;
					}
				}
				// Capture variable dump
                $buffer = trim(strip_tags(var_export($var, true)));
				$title = (!empty($title) ? " [$title]" : '');

				// Remove absolute path to plugin directory from buffer
				if ($trim_url) {
					$buffer = CrayonUtil::path_rel($buffer);
				}
				$write = $title . ' ' . $buffer . CRAYON_NL /* . CRAYON_LINE . CRAYON_NL*/;
				
				// If we exceed max file size, truncate file first
				if (filesize(CRAYON_LOG_FILE) + strlen($write) > CRAYON_LOG_MAX_SIZE) {
					ftruncate(self::$file, 0);
					fwrite(self::$file, 'The log has been truncated since it exceeded ' . CRAYON_LOG_MAX_SIZE .
						' bytes.' . CRAYON_NL . /*CRAYON_LINE .*/ CRAYON_NL);
				}
				clearstatcache();
				fwrite(self::$file, $write, CRAYON_LOG_MAX_SIZE);
			} catch (Exception $e) {
				// Ignore fatal errors during logging
			}
		}
	}

	// Logs system-wide only if global settings permit

	public static function syslog($var = NULL, $title = '', $trim_url = TRUE) {
		if (CrayonGlobalSettings::val(CrayonSettings::ERROR_LOG_SYS)) {
			$title = (empty($title)) ? 'SYSTEM LOG' : $title;
			self::log($var, $title, $trim_url);
		}
	}
	
	public static function debug($var = NULL, $title = '', $trim_url = TRUE) {
		if (CRAYON_DEBUG) {
			$title = (empty($title)) ? 'DEBUG' : $title;
			self::log($var, $title, $trim_url);
		}
	}

	public static function clear() {
		if (!@unlink(CRAYON_LOG_FILE)) {
			// Will result in nothing if we can't log

			self::log('The log could not be cleared', 'Log Clear');
		}
		self::$file = NULL; // Remove file handle

	}

	public static function email($to, $from = NULL) {
		if (($log_contents = CrayonUtil::file(CRAYON_LOG_FILE)) !== FALSE) {
			$headers = $from ? 'From: ' . $from : '';
			$result = @mail($to, 'Crayon Syntax Highlighter Log', $log_contents, $headers);
			self::log('The log was emailed to the admin.', 'Log Email');
		} else {
			// Will result in nothing if we can't email

			self::log("The log could not be emailed to $to.", 'Log Email');
		}
	}
}
?>