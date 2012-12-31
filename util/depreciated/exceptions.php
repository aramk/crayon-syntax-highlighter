<?php
require_once ('crayon_util.class.php');

/* Custom exception that also logs exceptions */
class CrayonException extends Exception {

	// message() function used to prevent HTML formatting inside returned messages

	function message() {
		return html_entity_decode($this->getMessage());
	}
}

class CrayonErrorException extends ErrorException {

	public function message() {
		return crayon_exception_message($this); //htmlentities( $this->getMessage() );

	}
}

function crayon_exception_message($exception) {
	return html_entity_decode(CRAYON_NL . '[Line ' . $exception->getLine() . ', ' .
					basename(CrayonUtil::path_rel($exception->getFile())) .
					'] ' . CRAYON_NL . $exception->getMessage());
}

function crayon_exception_log($exception) {
	$info = crayon_exception_info($exception);
	// Log the exception

	CrayonLog::syslog(strip_tags($info));
	if (CRAYON_DEBUG) {
		// Only print when debugging

		echo $info;
	}
}

/* Custom handler for CrayonExceptions */
function crayon_exception_handler($exception) {
	try {
		crayon_exception_log($exception);
	} catch (Exception $e) {
		// An error within an error handler. Exception.

		echo '<br/><b>Fatal Exception:</b> ', get_class($e),
			' thrown within the exception handler.<br/><b>Message:</b> ',
			$e->getMessage(), '<br/><b>Line:</b> ',
				CrayonUtil::path_rel($e->getFile()), '<br/><b>Line:</b> ', $e->getLine();
	}
}

/* Prints exception info */
function crayon_exception_info($e, $return = TRUE) {
	$print = '<br/><b>Uncaught ' . get_class($e) . ':</b> ' . $e->getMessage() . CRAYON_BL . '<b>File:</b> ' .
			 CrayonUtil::path_rel($e->getFile()) . CRAYON_BL . '<b>Line:</b> ' . $e->getLine() . CRAYON_BL . '<br/>';
	if ($return) {
		return $print;
	} else {
		echo $print;
	}
}

/* Some errors throw catchable exceptions, so we can handle them nicely */
function crayon_error_handler($errno, $errstr, $errfile, $errline) {

	if (!(error_reporting() & $errno)) {
		// This error code is not included in error_reporting

		return;
	}
	$e = new CrayonErrorException($errstr, 0, $errno, $errfile, $errline);
	if (in_array($errno, array(E_ERROR, E_USER_ERROR))) {
		// Only throw an exception for fatal errors

		throw $e;
	} else {

		// Treat all other errors as usual

		return false;
	}
	// Don't execute PHP internal error handler

	return true;
}
/*  Records the old error handlers and reverts back to them when needed. */
$old_error_handler = null;
$old_exception_handler = null;

/* Turn on the custom handlers */
function crayon_handler_on() {
	global $old_error_handler, $old_exception_handler;
	$old_error_handler = set_error_handler('crayon_error_handler');
	$old_exception_handler = set_exception_handler('crayon_exception_handler');
}

/* Turn off the custom handlers */
function crayon_handler_off() {
	global $old_error_handler, $old_exception_handler;
	if (!empty($old_error_handler)) {
		set_error_handler($old_error_handler);
	}
	if (!empty($old_exception_handler)) {
		set_exception_handler($old_exception_handler);
	}
}
?>