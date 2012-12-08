<?php

// TODO this needs lots of work! remove the old wp_load procedure

require_once('../../crayon_wp.class.php');
$theme = CrayonResources::themes()->get_default();
$editing = false;

if ( isset($_GET['curr_theme']) ) {
	$currTheme = CrayonResources::themes()->get($_GET['curr_theme']);
	if ($currTheme) {
		$theme = $currTheme;
	}
}

if ( isset($_GET['editing']) ) {
	$editing = CrayonUtil::str_to_bool($_GET['editing'], FALSE);
}

class Input {
	public $id;
	public $name;
	public $value;
	public $type;
	
	public function __construct($id, $name, $value = '', $type = 'text') {
		$this->id = $id;
		$this->name = $name;
		$this->value = $value;
		$this->type = $type;
	}
	
	public function __toString() {
		return '<input id="crayon-theme-editor-'.$this->id.'" class="crayon-theme-editor-'.$this->type.'" type="'.$this->type.'" />';
	}
}

function form($inputs) {
	echo '<form class="crayon-theme-editor-form"><table>';
	foreach($inputs as $input) {
		echo '<tr><td class="field">',$input->name,'</td><td class="value">',$input,'</td></tr>';
	}
	echo '</table></form>';
}

?>

<div
	id="icon-options-general" class="icon32"></div>
<h2>
	Crayon Syntax Highlighter
	<?php crayon_e('Theme Editor'); ?>
</h2>

<h3>
	<?php 
	if ($editing) {
		echo sprintf(crayon__('Editing "%s" Theme'), $theme->name());
	} else {
		echo sprintf(crayon__('Creating Theme From "%s"'), $theme->name());
	}
	?>
</h3>

<p>
	<a id="crayon-editor-back" class="button-primary"><?php crayon_e('Back To Settings'); ?></a>
	<a id="crayon-editor-save" class="button-primary"><?php crayon_e('Save'); ?></a>
</p>

<?php //crayon_e('Use the Sidebar on the right to change the Theme of the Preview window.') ?>

<div
	id="crayon-editor-top-controls"></div>

<table id="crayon-editor-table" style="width: 100%;" cellspacing="5"
	cellpadding="0">
	<tr>
		<td id="crayon-editor-preview-wrapper">
			<div id="crayon-editor-preview"></div>
		</td>
<!-- 	</tr> -->
<!-- 	<tr> -->
		<td id="crayon-editor-control-wrapper">
			<div id="crayon-editor-controls">
				<ul>
					<li><a href="#tabs-1">General Info</a></li>
					<li><a href="#tabs-2">Highlighting</a></li>
					<li><a href="#tabs-3">Lines</a></li>
					<li><a href="#tabs-3">Numbers</a></li>
					<li><a href="#tabs-3">Toolbars</a></li>
				</ul>
				<div id="tabs-1">
					<?php 
						form(array(
							new Input('name', 'Name'),
							new Input('desc', 'Description'),
							new Input('version', 'Version'),
							new Input('author', 'Author'),
							new Input('url', 'Author URI'),
						));
					?>
				</div>
				<div id="tabs-2">
					<p>Morbi tincidunt, dui sit amet facilisis feugiat, odio metus
						gravida ante, ut pharetra massa metus id nunc. Duis scelerisque
						molestie turpis. Sed fringilla, massa eget luctus malesuada, metus
						eros molestie lectus, ut tempus eros massa ut dolor. Aenean
						aliquet fringilla sem. Suspendisse sed ligula in ligula suscipit
						aliquam. Praesent in eros vestibulum mi adipiscing adipiscing.
						Morbi facilisis. Curabitur ornare consequat nunc. Aenean vel
						metus. Ut posuere viverra nulla. Aliquam erat volutpat.
						Pellentesque convallis. Maecenas feugiat, tellus pellentesque
						pretium posuere, felis lorem euismod felis, eu ornare leo nisi vel
						felis. Mauris consectetur tortor et purus.</p>
				</div>
				<div id="tabs-3">
					<p>Mauris eleifend est et turpis. Duis id erat. Suspendisse
						potenti. Aliquam vulputate, pede vel vehicula accumsan, mi neque
						rutrum erat, eu congue orci lorem eget lorem. Vestibulum non ante.
						Class aptent taciti sociosqu ad litora torquent per conubia
						nostra, per inceptos himenaeos. Fusce sodales. Quisque eu urna vel
						enim commodo pellentesque. Praesent eu risus hendrerit ligula
						tempus pretium. Curabitur lorem enim, pretium nec, feugiat nec,
						luctus a, lacus.</p>
					<p>Duis cursus. Maecenas ligula eros, blandit nec, pharetra at,
						semper at, magna. Nullam ac lacus. Nulla facilisi. Praesent
						viverra justo vitae neque. Praesent blandit adipiscing velit.
						Suspendisse potenti. Donec mattis, pede vel pharetra blandit,
						magna ligula faucibus eros, id euismod lacus dolor eget odio. Nam
						scelerisque. Donec non libero sed nulla mattis commodo. Ut
						sagittis. Donec nisi lectus, feugiat porttitor, tempor ac, tempor
						vitae, pede. Aenean vehicula velit eu tellus interdum rutrum.
						Maecenas commodo. Pellentesque nec elit. Fusce in lacus. Vivamus a
						libero vitae lectus hendrerit hendrerit.</p>
				</div>
			</div>
		</td>
	</tr>

</table>
