<?php

require_once('../crayon_wp.class.php');
crayon_die_if_not_php($_GET['wp_load'], 'wp-load');
require_once($_GET['wp_load']);

$posts = CrayonSettingsWP::load_posts();
arsort($posts);

echo '<table class="crayon-table" cellspacing="0" cellpadding="0"><tr class="crayon-table-header">',
'<td>ID</td><td>Title</td><td>Posted</td><td>Modified</td></tr>';

for ($i = 0; $i < count($posts); $i++) {
	$postID = $posts[$i];
	$post = get_post($postID);
	$tr = ($i == count($langs) - 1) ? 'crayon-table-last' : '';
	echo '<tr class="', $tr, '">',
	'<td>', $postID, '</td>',
	'<td><a href="', $post->guid ,'" target="_blank">', $post->post_title, '</a></td>',
	'<td>', $post->post_date, '</td>',
	'<td>', $post->post_modified, '</td>',
	'</tr>';
}

echo '</table>';

?>