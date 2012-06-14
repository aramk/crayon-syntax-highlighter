<?php

$crayon_root_theme = dirname(dirname(dirname(__FILE__))) . '/';
require_once $crayon_root_theme . 'global.php';

//class CrayonThemeEditor {
//	
//}

?>

<div id="icon-options-general" class="icon32"><br>
</div>
<h2>Crayon Syntax Highlighter <?php crayon_e('Theme Editor'); ?></h2>

<p><a class="button-primary" onclick="CrayonSyntaxAdmin.show_main();"><?php crayon_e('Back To Settings'); ?></a></p>

<?php //crayon_e('Use the Sidebar on the right to change the Theme of the Preview window.') ?>

<div id="crayon-editor-top-controls"></div>

<table id="crayon-editor-table" style="width: 100%;" cellspacing="5" cellpadding="0">
	<tr>
		<td class="crayon-editor-preview-wrapper">
			<div id="crayon-editor-preview">
				<?php
					$crayon_preview_text_hide = TRUE;
					$crayon_preview_settings = TRUE;
//					require_once $root_path . CRAYON_PREVIEW_PHP;
				?>
			</div>
		</td>
		<td class="crayon-editor-control-wrapper">
			<div id="crayon-editor-controls"></div>
		</td>
	</tr>

</table>
