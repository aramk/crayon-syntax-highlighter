<?php

/* Used to measure execution time */
class CrayonTimer {
	const NO_SET = -1;
	private $start_time = self::NO_SET;

	function __construct() {}

	public function start() {
		$this->start_time = microtime(true);
	}

	public function stop() {
		if ($this->start_time != self::NO_SET) {
			$end_time = microtime(true) - $this->start_time;
			$this->start_time = self::NO_SET;
			return $end_time;
		} else {
			return 0;
		}
	}
}
?>