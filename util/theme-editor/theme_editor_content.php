<?php

$crayon_root_theme_editor = dirname(dirname(dirname(__FILE__)));
require_once ($crayon_root_theme_editor . '/crayon_wp.class.php');
require_once (CrayonWP::wp_load_path());

$theme = CrayonResources::themes()->get_default();
$editing = false;

if ( isset($_GET['curr_theme']) ) {
	$theme = CrayonResources::themes()->get($_GET['curr_theme']);
}

if ( isset($_GET['editing']) ) {
	$editing = CrayonUtil::str_to_bool($_GET['editing'], FALSE);
}

// var_dump($_GET);

// var_dump($theme);
// var_dump($editing);

?>

<div id="icon-options-general" class="icon32"><br>
</div>
<h2>Crayon Syntax Highlighter <?php crayon_e('Theme Editor'); ?></h2>

<h3>
<?php 
	if ($editing) {
		echo sprintf(crayon__('Editing "%s" Theme'), $theme->name());
	} else {
		echo sprintf(crayon__('Creating Theme From "%s"'), $theme->name());
	}
?>
</h3>

<p><a class="button-primary" onclick="CrayonSyntaxAdmin.show_main();"><?php crayon_e('Back To Settings'); ?></a></p>

<?php //crayon_e('Use the Sidebar on the right to change the Theme of the Preview window.') ?>

<div id="crayon-editor-top-controls"></div>

<table id="crayon-editor-table" style="width: 100%;" cellspacing="5" cellpadding="0">
	<tr>
		<td id="crayon-editor-preview-wrapper">
			<div id="crayon-editor-preview"></div>
		</td>
	</tr>
	<tr>
		<td id="crayon-editor-control-wrapper">
			<div id="crayon-editor-controls"></div>
		</td>
	</tr>

</table>
