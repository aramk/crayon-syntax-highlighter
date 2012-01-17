<?php
require_once ('global.php');
require_once (CRAYON_HIGHLIGHTER_PHP);
require_once (CRAYON_SETTINGS_PHP);
require_once (CRAYON_PARSER_PHP);
require_once (CRAYON_THEMES_PHP);

/*	Manages formatting the html with html and css. */
class CrayonFormatter {
	// Properties and Constants ===============================================
	/*	Used to temporarily store the array of CrayonElements passed to format_code(), so that
	 format_matches() can access them and identify which elements were captured and format
	 accordingly. This must be static for preg_replace_callback() to access it.*/
	private static $elements = array();

	// Methods ================================================================
	private function __construct() {}

	/* Formats the code using the regex and stores the elements for later use. */
	public static function format_code($code, $language, $highlight = TRUE, $hl = NULL) {
		// Ensure the language is defined
		if ($language != NULL && $highlight) {
			/* Perform the replace on the code using the regex, pass the captured matches for
			 formatting before they are replaced */
			try {
				// Match language regex
				$elements = $language->elements();
				$regex = $language->regex();
				
				if (!empty($regex) && !empty($elements)) {
					// Get array of CrayonElements
					self::$elements = array_values($elements);
					$code = preg_replace_callback($regex, 'CrayonFormatter::format_match', $code);
				}
			} catch (Exception $e) {
				$error = 'An error occured when formatting: ' . $e->message();
				$hl ? $hl->log($error) : CrayonLog::syslog($error);
			}
			
			return $code;
		} else {			
			return self::clean_code($code);
		}
	}

	/* Performs a replace to format each match based on the captured element. */
	private static function format_match($matches) {		
		/* First index in $matches is full match, subsequent indices are groups.
		 * Minimum number of elements in array is 2, so minimum captured group is 0. */
		$captured_group_number = count($matches) - 2;
		if (array_key_exists($captured_group_number, self::$elements)) {
			$captured_element = self::$elements[$captured_group_number];
			// Avoid capturing and formatting internal Crayon elements
			if ($captured_element->name() == CrayonParser::CRAYON_ELEMENT) {
				return $matches[0]; // Return as is
			} else {
				// Separate lines and add css class.
				$css = $captured_element->css() . CrayonLangs::known_elements($captured_element->fallback());
				return self::split_lines($matches[0], $css);
			}
		} else {
			// All else fails, return the match
			return $matches[0];
		}
	}

	/* Prints the formatted code, option to override the line numbers with a custom string */
	public static function print_code($hl, $code, $line_numbers = TRUE, $print = TRUE) {
		if (get_class($hl) != CRAYON_HIGHLIGHTER) {
			return;
		}
		
		global $CRAYON_VERSION;
		
		// Generate the code lines and separate each line as a div
		$print_code = '';
		$print_nums = '';
		$hl->line_count(preg_match_all("|^.*$|m", $code, $code_lines));
		
		// The line number to start from
		$start_line = $hl->setting_val(CrayonSettings::START_LINE);
		$marking = $hl->setting_val(CrayonSettings::MARKING);
		$striped = $hl->setting_val(CrayonSettings::STRIPED);
		for ($i = 1; $i <= $hl->line_count(); $i++) {
			$code_line = $code_lines[0][$i - 1];
			// Check if the current line has been selected
			$marked_lines = $hl->marked();
			// Check if lines need to be marked as important
			if ($marking && in_array($i, $marked_lines)) {
				$marked_num = ' crayon-marked-num';
				$marked_line = ' crayon-marked-line';
				// If multiple lines are marked, only show borders for top and bottom lines
				if (!in_array($i - 1, $marked_lines)) {
					$marked_num .= ' crayon-top';
					$marked_line .= ' crayon-top';
				}
				// Single lines are both the top and bottom of the multiple marked lines
				if (!in_array($i + 1, $marked_lines)) {
					$marked_num .= ' crayon-bottom';
					$marked_line .= ' crayon-bottom';
				}
			} else {
				$marked_num = $marked_line = '';
			}
			// Stripe odd lines
			if ($striped && $i % 2 == 0) {
				$striped_num = ' crayon-striped-num';
				$striped_line = ' crayon-striped-line';
			} else {
				$striped_num = $striped_line = '';
			}
			// Generate the lines
			$line_num = $start_line + $i - 1;
			$print_code .= '<div class="crayon-line' . $marked_line . $striped_line . '" id="line-' . $line_num . '">' . $code_line . '</div>';
			if (!is_string($line_numbers)) {
				$print_nums .= '<div class="crayon-num' . $marked_num . $striped_num . '">' . $line_num . '</div>';
			}
		}
		// If $line_numbers is a string, display it
		if (is_string($line_numbers) && !empty($line_numbers)) {
			$print_nums .= '<div class="crayon-num">' . $line_numbers . '</div>';
		} else if ( empty($line_numbers) ) {
			$print_nums = FALSE;
		}
		// Determine whether to print title
		$title = $hl->title();
		$print_title = ($hl->setting_val(CrayonSettings::SHOW_TITLE) && $title ? '<span class="crayon-title">' . $title . '</span>' : '');
		// Determine whether to print language
		$print_lang = '';
		if ($hl->language()) {
			$lang = $hl->language()->name();
			switch ($hl->setting_index(CrayonSettings::SHOW_LANG)) {
				case 0 :
					if ($hl->language()->id() == CrayonLangs::DEFAULT_LANG) {
						break;
					}
				// Falls through
				case 1 :
					$print_lang = '<span class="crayon-language">' . $lang . '</span>';
					break;
			}
		}
		// Unique ID for this instance of Crayon
		$uid = 'crayon-' . $hl->id();
		// Disable functionality for errors
		$error = $hl->error();
		// Combined settings for code
		$code_settings = '';
		// Disable mouseover for touchscreen devices and mobiles, if we are told to
		$touch = FALSE; // Whether we have detected a touchscreen device
		if ($hl->setting_val(CrayonSettings::TOUCHSCREEN) && CrayonUtil::is_touch()) {
			$touch = TRUE;
			$code_settings .= ' touchscreen';
		}
		// Draw the plain code and toolbar
		$toolbar_settings = '';
		if (empty($error) && $hl->setting_index(CrayonSettings::TOOLBAR) != 2) {
			// Enable mouseover setting for toolbar
			if ($hl->setting_index(CrayonSettings::TOOLBAR) == 0 && !$touch) {
				// No touchscreen detected
				$toolbar_settings .= ' mouseover';
				if ($hl->setting_val(CrayonSettings::TOOLBAR_OVERLAY)) {
					$toolbar_settings .= ' overlay';
				}
				if ($hl->setting_val(CrayonSettings::TOOLBAR_HIDE)) {
					$toolbar_settings .= ' hide';
				}
				if ($hl->setting_val(CrayonSettings::TOOLBAR_DELAY)) {
					$toolbar_settings .= ' delay';
				}
			} else if ($hl->setting_index(CrayonSettings::TOOLBAR) == 1) {
				// Always display the toolbar
				$toolbar_settings .= 'show';
			} else {
				$toolbar_settings .= '';
			}
			if ($hl->setting_val(CrayonSettings::PLAIN)) {
				// Different events to display plain code
				switch ($hl->setting_index(CrayonSettings::SHOW_PLAIN)) {
					case 0 :
						$plain_settings = 'dblclick';
						break;
					case 1 :
						$plain_settings = 'click';
						break;
					case 2 :
						$plain_settings = 'mouseover';
						break;
					default :
						$plain_settings = '';
				}
				if ($hl->setting_val(CrayonSettings::SHOW_PLAIN_DEFAULT)) {
					$plain_settings .= ' show-plain-default';
				}
				$tab = $hl->setting_val(CrayonSettings::TAB_SIZE);
				// TODO doesn't seem to work at the moment
				$plain_style = "-moz-tab-size:$tab; -o-tab-size:$tab; -webkit-tab-size:$tab; tab-size:$tab;";
				$readonly = $touch ? '' : 'readonly';
				$print_plain = $print_plain_button = '';
				$print_plain = '<textarea class="crayon-plain" settings="' . $plain_settings . '" '. $readonly .'  wrap="off" style="' . $plain_style .'">' . self::clean_code($hl->code()) . '</textarea>';
				$print_plain_button = $hl->setting_val(CrayonSettings::PLAIN_TOGGLE) ? '<a class="crayon-plain-button crayon-button" title="Toggle Plain Code"></a>' : '';
				$print_copy_button = !$touch && $hl->setting_val(CrayonSettings::PLAIN) && $hl->setting_val(CrayonSettings::COPY) ?
					'<a class="crayon-copy-button crayon-button" title="Copy Plain Code"></a>' : '';
			} else {
				$print_plain = $plain_settings = $print_plain_button = $print_copy_button = '';
			}
			
			$print_popup_button = $hl->setting_val(CrayonSettings::POPUP) ?
				'<a class="crayon-popup-button crayon-button" title="Open Code in Window" onclick="return false;"></a>' : '';
			
			if ($hl->setting_val(CrayonSettings::NUMS_TOGGLE)) {
				$print_nums_button = '<a class="crayon-nums-button crayon-button" title="Toggle Line Numbers"></a>';
			} else {
				$print_nums_button = '';
			}
			/*	The table is rendered invisible by CSS and enabled with JS when asked to. If JS
			 is not enabled or fails, the toolbar won't work so there is no point to display it. */

			$print_plus = $hl->is_mixed() && $hl->setting_val(CrayonSettings::SHOW_MIXED) ? '<span class="crayon-mixed-highlight" title="Contains Mixed Languages"></span>' : '';
			$buttons = $print_plus.$print_nums_button.$print_copy_button.$print_popup_button.$print_plain_button.$print_lang;
			$button_preload = '';
			foreach (array('nums', 'copy', 'popup', 'plain') as $name) {
				$button_preload .= '<a class="crayon-'.$name.'-button crayon-button crayon-pressed crayon-invisible"></a>';
			}
			$toolbar = '
			<div class="crayon-toolbar" settings="'.$toolbar_settings.'">'.$print_title.'
			<div class="crayon-tools">'.$buttons.$button_preload.'</div>
			</div><div>'.$print_plain.'</div>'.'<div class="crayon-info"></div>';

		} else {
			$toolbar = $buttons = $plain_settings = '';
		}
		
		// Print strings
		$output = $main_style = $code_style = $font_style = '';
		
		// Line numbers visibility
		$num_vis = $num_settings = '';
		if ($line_numbers === FALSE) {
			$num_vis = 'crayon-invisible';
		} else {
			$num_settings = ($hl->setting_val(CrayonSettings::NUMS) ? 'show' : 'hide');
		}
		
		// Print theme id
		// We make the assumption that the id is correct (checked in crayon_wp)
		$theme_id = $hl->setting_val(CrayonSettings::THEME);
		$theme_id_dashed = CrayonUtil::space_to_hyphen($theme_id);
		
		if (!$hl->setting_val(CrayonSettings::ENQUEUE_THEMES)) {
			$output .= CrayonResources::themes()->get_css($theme_id);
		}
		
		// Print theme id
		// We make the assumption that the id is correct (checked in crayon_wp)
		$font_id = $hl->setting_val(CrayonSettings::FONT);
		$font_id_dashed = '';
		
		if ($font_id != NULL && $font_id != CrayonFonts::DEFAULT_FONT) {
			if (!$hl->setting_val(CrayonSettings::ENQUEUE_FONTS)) {
				$output .= CrayonResources::fonts()->get_css($font_id);
			}
			$font_id_dashed = 'crayon-font-' . CrayonUtil::space_to_hyphen($font_id); 
		}
		
		// Determine font size
		// TODO improve logic
		if ($hl->setting_val(CrayonSettings::FONT_SIZE_ENABLE)) {
			$font_size = $hl->setting_val(CrayonSettings::FONT_SIZE) . 'px !important;';
			$font_height = ($font_size + 4) . 'px !important;';
			$toolbar_height = ($font_size + 8) . 'px !important;';
			$font_style .= "#$uid * { font-size: $font_size line-height: $font_height}";
			$font_style .= "#$uid .crayon-toolbar, #$uid .crayon-toolbar div { height: $toolbar_height line-height: $toolbar_height }\n";
			$font_style .= "#$uid .crayon-num, #$uid .crayon-line, #$uid .crayon-toolbar a.crayon-button { height: $font_height }\n";
		} else {
			if (($font_size = CrayonGlobalSettings::get(CrayonSettings::FONT_SIZE)) !== FALSE) {
				$font_size = $font_size->def() . 'px !important;';
				$font_height = ($font_size + 4) . 'px !important;';
				// Correct font CSS for WP 3.3
				$font_style .= "#$uid .crayon-plain { font-size: $font_size line-height: $font_height}";
			}
		}
		
		// Determine scrollbar visibility
		switch ($hl->setting_index(CrayonSettings::SCROLL) && !$touch) {
			case 0 :
				$code_settings .= ' scroll-mouseover';
				break;
			default :
				$code_settings .= ' scroll-always';
		}
		
		// Disable animations
		if ($hl->setting_val(CrayonSettings::DISABLE_ANIM)) {
			$code_settings .= ' disable-anim';
		}
		
		// Determine dimensions
		if ($hl->setting_val(CrayonSettings::HEIGHT_SET)) {
			$height_style = self::dimension_style($hl, CrayonSettings::HEIGHT);
			// XXX Only set height for main, not code (if toolbar always visible, code will cover main)
			if ($hl->setting_index(CrayonSettings::HEIGHT_UNIT) == 0) {
				$main_style .= $height_style;
			}
		}
		if ($hl->setting_val(CrayonSettings::WIDTH_SET)) {
			$width_style = self::dimension_style($hl, CrayonSettings::WIDTH);
			$code_style .= $width_style;
			if ($hl->setting_index(CrayonSettings::WIDTH_UNIT) == 0) {
				$main_style .= $width_style;
			}
		}
		
		// Determine margins
		if ($hl->setting_val(CrayonSettings::TOP_SET)) {
			$code_style .= ' margin-top: ' . $hl->setting_val(CrayonSettings::TOP_MARGIN) . 'px;';
		}
		if ($hl->setting_val(CrayonSettings::BOTTOM_SET)) {
			$code_style .= ' margin-bottom: ' . $hl->setting_val(CrayonSettings::BOTTOM_MARGIN) . 'px;';
		}
		if ($hl->setting_val(CrayonSettings::LEFT_SET)) {
			$code_style .= ' margin-left: ' . $hl->setting_val(CrayonSettings::LEFT_MARGIN) . 'px;';
		}
		if ($hl->setting_val(CrayonSettings::RIGHT_SET)) {
			$code_style .= ' margin-right: ' . $hl->setting_val(CrayonSettings::RIGHT_MARGIN) . 'px;';
		}
		
		// Determine horizontal alignment
		$align_style = ' float: none;';
		switch ($hl->setting_index(CrayonSettings::H_ALIGN)) {
			case 1 :
				$align_style = ' float: left;';
				break;
			case 2 :
				$align_style = ' float: none; margin-left: auto; margin-right: auto;';
				break;
			case 3 :
				$align_style = ' float: right;';
				break;
		}
		$code_style .= $align_style;
		
		// Determine allowed float elements
		if ($hl->setting_val(CrayonSettings::FLOAT_ENABLE)) {
			$clear_style = ' clear: none;';
		} else {
			$clear_style = ' clear: both;';
		}
		$code_style .= $clear_style;
		
		// Determine if operating system is mac
		$crayon_os = CrayonUtil::is_mac() ? 'mac' : 'pc';
		
		// Produce style for individual crayon
		$output .= '<style type="text/css">'.$font_style.'</style>';
		
		// Produce output
		$output .= '
		<div id="'.$uid.'" class="crayon-syntax crayon-theme-'.$theme_id_dashed.' '.$font_id_dashed.'" crayon-os="'.$crayon_os.'" settings="'.$code_settings.'" style="'.$code_style.'">
		'.$toolbar.'
			<div class="crayon-main" style="'.$main_style.'">
				<table class="crayon-table" cellpadding="0" cellspacing="0">
					<tr class="crayon-row">';

		if ($print_nums !== FALSE) {
		$output .= '
				<td class="crayon-nums '.$num_vis.'" settings="'.$num_settings.'">
					<div class="crayon-nums-content">'.$print_nums.'</div>
				</td>';
		}
		// XXX
		$output .= '
						<td class="crayon-code"><div class="crayon-pre">'.$print_code.'</div></td>
					</tr>
				</table>
			</div>
		</div>';
		// Debugging stats
		$runtime = $hl->runtime();
		if (!$hl->setting_val(CrayonSettings::DISABLE_RUNTIME) && is_array($runtime) && !empty($runtime)) {
			$output = CRAYON_NL . CRAYON_NL . '<!-- Crayon Syntax Highlighter v' . $CRAYON_VERSION . ' -->'
				. CRAYON_NL . $output . CRAYON_NL . '<!-- ';
			foreach ($hl->runtime() as $type => $time) {
				$output .= '[' . $type . ': ' . sprintf('%.4f seconds', $time) . '] ';
			}
			$output .= '-->' . CRAYON_NL . CRAYON_NL;
		}
		// Determine whether to print to screen or save
		if ($print) {
			echo $output;
		} else {
			return $output;
		}
	}

	function print_error($hl, $error, $line_numbers = 'ERROR', $print = TRUE) {
		if (get_class($hl) != CRAYON_HIGHLIGHTER) {
			return;
		}
		// Either print the error returned by the handler, or a custom error message
		if ($hl->setting_val(CrayonSettings::ERROR_MSG_SHOW)) {
			$error = $hl->setting_val(CrayonSettings::ERROR_MSG);
		}
		$error = self::split_lines(trim($error), 'error');
		return self::print_code($hl, $error, $line_numbers, $print);
	}

	// Auxiliary Methods ======================================================
	/* Prepares code for formatting. */
	public static function clean_code($code) {
		if (empty($code)) {
			return $code;
		}
		/* Replace <, > and & characters, as these can appear as HTML tags and entities. */
		$code = htmlspecialchars($code, ENT_NOQUOTES);
		// Replace 2 spaces with html escaped characters
		$code = preg_replace('|	 |', '&nbsp;&nbsp;', $code);
		// Replace tabs with 4 spaces
		$code = preg_replace('|\t|', str_repeat('&nbsp;', CrayonGlobalSettings::val(CrayonSettings::TAB_SIZE)), $code);
		return $code;
	}
	
	/* Converts the code to entities and wraps in a <pre><code></code></pre> */
	public static function plain_code($code) {
		if (is_array($code)) {
			// When used as a preg_replace_callback
			$code = $code[1];
		}
		$code = CrayonUtil::htmlentities($code);
		if (CrayonGlobalSettings::val(CrayonSettings::TRIM_WHITESPACE)) {
			$code = trim($code);
		}
		return '<pre><code>'.$code.'</code></pre>';
	}

	public static function split_lines($code, $class) {
		$code = self::clean_code($code);
		$code = preg_replace('|^|m', '<span class="'.$class.'">', $code);
		$code = preg_replace('|$|m', '</span>', $code);
		return $code;
	}

	private static function dimension_style($hl, $name) {
		$mode = $unit = '';
		switch ($name) {
			case CrayonSettings::HEIGHT :
				$mode = CrayonSettings::HEIGHT_MODE;
				$unit = CrayonSettings::HEIGHT_UNIT;
				break;
			case CrayonSettings::WIDTH :
				$mode = CrayonSettings::WIDTH_MODE;
				$unit = CrayonSettings::WIDTH_UNIT;
				break;
		}
		// XXX Uses actual index value to identify options
		$mode = $hl->setting_index($mode);
		$unit = $hl->setting_index($unit);
		$dim_mode = $dim_unit = '';
		if ($mode !== FALSE) {
			switch ($mode) {
				case 0 :
					$dim_mode .= 'max-';
					break;
				case 1 :
					$dim_mode .= 'min-';
					break;
			}
		}
		$dim_mode .= $name;
		if ($unit !== FALSE) {
			switch ($unit) {
				case 0 :
					$dim_unit = 'px';
					break;
				case 1 :
					$dim_unit = '%';
					break;
			}
		}
		return ' ' . $dim_mode . ': ' . $hl->setting_val($name) . $dim_unit . ';';
	}
}
?>