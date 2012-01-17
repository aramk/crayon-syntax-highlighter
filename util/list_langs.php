<?php
require_once (dirname(dirname(__FILE__)) . '/global.php');
require_once (CRAYON_PARSER_PHP);
if (($langs = CrayonParser::parse_all()) != FALSE) {
	echo '<table class="crayon-table" cellspacing="0" cellpadding="0"><tr class="crayon-table-header">',
		'<td>ID</td><td>Name</td><td>Version</td><td>File Extensions</td><td>Aliases</td><td>State</td></tr>';
	$keys = array_values($langs);
	for ($i = 0; $i < count($langs); $i++) {
		$lang = $keys[$i];
		$tr = ($i == count($langs) - 1) ? 'crayon-table-last' : '';
		echo '<tr class="', $tr, '">',
		        '<td>', $lang->id(), '</td>',
		        '<td>', $lang->name(), '</td>',
		        '<td>', $lang->version(), '</td>',
				'<td>', implode(', ', $lang->ext()), '</td>',
				'<td>', implode(', ', $lang->alias()), '</td>',
				'<td class="', strtolower(CrayonUtil::space_to_hyphen($lang->state_info())), '">', 
					$lang->state_info(), '</td>',
			'</tr>';
	}
	echo '</table><br/>Languages that have the same extension as their name don\'t need to explicitly map extensions.';
} else {
	echo 'No languages could be found.';
}
?>