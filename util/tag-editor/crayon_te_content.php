<div id="crayon-te-content">

<?php 

$crayon_root_te = dirname(dirname(dirname(__FILE__)));
require_once ($crayon_root_te . '/crayon_wp.class.php');
require_once (CrayonWP::wp_load_path());
require_once (CRAYON_TE_PHP);
require_once (CRAYON_PARSER_PHP);

CrayonSettingsWP::load_settings();
$langs = CrayonParser::parse_all();
$curr_lang = CrayonGlobalSettings::val(CrayonSettings::FALLBACK_LANG);
$themes = CrayonResources::themes()->get();
$curr_theme = CrayonGlobalSettings::val(CrayonSettings::THEME);
$fonts = CrayonResources::fonts()->get();
$curr_font = CrayonGlobalSettings::val(CrayonSettings::FONT);
CrayonTagEditorWP::init_settings();

class CrayonTEContent {
	
	public static function select_resource($id, $resources, $current, $set_class = TRUE) {
		$id = CrayonSettings::PREFIX . $id;
		if (count($resources) > 0) {
			$class = $set_class ? 'class="'.CrayonSettings::SETTING.' '.CrayonSettings::SETTING_SPECIAL.'"' : ''; 
			echo '<select id="'.$id.'" name="'.$id.'" '.$class.' '.CrayonSettings::SETTING_ORIG_VALUE.'="'.$current.'">';
				foreach ($resources as $resource) {
					$asterisk = $current == $resource->id() ? ' *' : '';
					echo '<option value="'.$resource->id().'" '.selected($current, $resource->id()).' >'.$resource->name().$asterisk.'</option>';
				}
			echo '</select>';
		} else {
			// None found, default to text box
			echo '<input type="text" id="'.$id.'" name="'.$id.'" class="'.CrayonSettings::SETTING.' '.CrayonSettings::SETTING_SPECIAL.'" />';
		}
	}
	
	public static function checkbox($id) {
		$id = CrayonSettings::PREFIX . $id;
		echo '<input type="checkbox" id="'.$id.'" name="'.$id.'" class="'.CrayonSettings::SETTING.' '.CrayonSettings::SETTING_SPECIAL.'" />';
	}
	
	public static function textbox($id, $atts = array(), $set_class = TRUE) {
		$id = CrayonSettings::PREFIX . $id;
		$atts_str = '';
		$class = $set_class ? 'class="'.CrayonSettings::SETTING.' '.CrayonSettings::SETTING_SPECIAL.'"' : '';
		foreach ($atts as $k=>$v) {
			$atts_str = $k.'="'.$v.'" ';
		}
		echo '<input type="text" id="'.$id.'" name="'.$id.'" '.$class.' '.$atts_str.' />';
	}
	
	public static function submit() {
		?>
		<input type="button" class="button-primary <?php echo CrayonTagEditorWP::$settings['submit_css']; ?>" value="<?php echo CrayonTagEditorWP::$settings['submit_add']; ?>" name="submit" />
		<?php
	}
}

?>

	<table id="crayon-te-table" class="describe">
		<tr class="crayon-tr-center">
			<th><?php crayon_e('Title'); ?></th>
			<td class="crayon-nowrap">
				<?php CrayonTEContent::textbox('title', array('placeholder'=>crayon__('A short description'))); ?>
				<span id="crayon-te-sub-section">
					<?php CrayonTEContent::checkbox('inline'); ?>
					<span class="crayon-te-section"><?php crayon_e('Inline'); ?></span>
				</span>
			</td>
		</tr>
		<tr class="crayon-tr-center">
			<th><?php crayon_e('Language'); ?></th>
			<td class="crayon-nowrap">
				<?php CrayonTEContent::select_resource('lang', $langs, $curr_lang); ?>
				<span class="crayon-te-section"><?php crayon_e('Marked Lines'); ?></span>
				<?php CrayonTEContent::textbox('mark', array('placeholder'=>crayon__('(e.g. 1,2,3-5)'))); ?>
				<span id="crayon-te-sub-section">
					<?php CrayonTEContent::checkbox('highlight'); ?>
					<span class="crayon-te-section"><?php crayon_e('Disable Highlighting'); ?></span>
				</span>
			</td>
		</tr>
		<tr class="crayon-tr-center">
			<th><?php crayon_e('Code'); ?> <input type="button" id="crayon-te-clear" class="secondary-primary" value="<?php crayon_e('Clear'); ?>" name="clear" /></th>
			<td><textarea id="crayon-code" name="code" placeholder="<?php crayon_e('Paste your code here, or type it in manually.'); ?>"></textarea></td>
		</tr>
		<tr class="crayon-tr-center">
			<th id="crayon-url-th"><?php crayon_e('URL'); ?></th>
			<td>
				<?php CrayonTEContent::textbox('url', array('placeholder'=>crayon__('Relative local path or absolute URL'))); ?>
				<div id="crayon-te-url-info" class="crayon-te-info">
				<?php
					crayon_e("If the URL fails to load, the code above will be shown instead. If no code exists, an error is shown.");
					echo ' ';
					printf(crayon__('If a relative local path is given it will be appended to %s - which is defined in %sCrayon &gt; Settings &gt; Files%s.'), '<span class="crayon-te-quote">'. get_home_url() . '/' . CrayonGlobalSettings::val(CrayonSettings::LOCAL_PATH) . '</span>', '<a href="options-general.php?page=crayon_settings" target="_blank">', '</a>');
				?>
			</div>
			</td>
		</tr>
		<tr>
			<td id="crayon-te-submit-wrapper" colspan="2" style="text-align: center;">
				<?php CrayonTEContent::submit(); ?>
			</td>
		</tr>
<!--		<tr>-->
<!--			<td colspan="2"><div id="crayon-te-warning" class="updated crayon-te-info"></div></td>-->
<!--		</tr>-->
		<tr>
			<td colspan="2">
			<hr />
			<div><h2 class="crayon-te-heading"><?php crayon_e('Settings'); ?></h2></div>
			<div id="crayon-te-settings-info" class="crayon-te-info">
			<?php
				crayon_e('Change the following settings to override their global values.');
				echo ' <span class="', CrayonSettings::SETTING_CHANGED, '">';
				crayon_e('Only changes (shown yellow) are applied.');
				echo '</span><br/>';
				echo sprintf(crayon__('Future changes to the global settings under %sCrayon &gt; Settings%s won\'t affect overridden settings.'), '<a href="options-general.php?page=crayon_settings" target="_blank">', '</a>');
			?>
			</div></td>
		</tr>
		<?php
			$sections = array('Theme', 'Font', 'Metrics', 'Toolbar', 'Lines', 'Code');
			foreach ($sections as $section) {
				echo '<tr><th>', crayon__($section), '</th><td>';
				call_user_func('CrayonSettingsWP::'.strtolower($section), TRUE);
				echo '</td></tr>';
			}
		?>
	</table>
</div>
