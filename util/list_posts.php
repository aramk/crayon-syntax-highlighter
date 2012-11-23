<?php

// Depreciated since 1.14

require_once('../crayon_wp.class.php');

$posts = CrayonSettingsWP::load_posts();
arsort($posts);

echo '<table class="crayon-table" cellspacing="0" cellpadding="0"><tr class="crayon-table-header">',
'<td>ID</td><td>Title</td><td>Posted</td><td>Modified</td></tr>';

for ($i = 0; $i < count($posts); $i++) {
	$postID = $posts[$i];
	$post = get_post($postID);
	$tr = ($i == count($posts) - 1) ? 'crayon-table-last' : '';
	echo '<tr class="', $tr, '">',
	'<td>', $postID, '</td>',
	'<td><a href="', $post->guid ,'" target="_blank">', $post->post_title, '</a></td>',
	'<td>', $post->post_date, '</td>',
	'<td>', $post->post_modified, '</td>',
	'</tr>';
}

echo '</table>';

?>