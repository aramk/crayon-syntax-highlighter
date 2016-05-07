<?php

/* Common utility functions mainly for formatting, parsing etc. */
class CrayonUtil {

    // Used to detect touchscreen devices
    private static $touchscreen = NULL;

    /* Return the lines inside a file as an array, options:
     l - lowercase
     w - remove whitespace
     r - escape regex chars
     c - remove comments
     s - return as string */
    public static function lines($path, $opts = NULL) {
        $path = self::pathf($path);
        if (($str = self::file($path)) === FALSE) {
            // Log failure, n = no log
            if (strpos($opts, 'n') === FALSE) {
                CrayonLog::syslog("Cannot read lines at '$path'.", "CrayonUtil::lines()");
            }
            return FALSE;
        }
        // Read the options
        if (is_string($opts)) {
            $lowercase = strpos($opts, 'l') !== FALSE;
            $whitespace = strpos($opts, 'w') !== FALSE;
            $escape_regex = strpos($opts, 'r') !== FALSE;
            $clean_commments = strpos($opts, 'c') !== FALSE;
            $return_string = strpos($opts, 's') !== FALSE;
//          $escape_hash = strpos($opts, 'h') !== FALSE;
        } else {
            $lowercase = $whitespace = $escape_regex = $clean_commments = $return_string = /*$escape_hash =*/
                FALSE;
        }
        // Remove comments
        if ($clean_commments) {
            $str = self::clean_comments($str);
        }

        // Convert to lowercase if needed
        if ($lowercase) {
            $str = strtolower($str);
        }
        /*  Match all the content on non-empty lines, also remove any whitespace to the left and
         right if needed */
        if ($whitespace) {
            $pattern = '[^\s]+(?:.*[^\s])?';
        } else {
            $pattern = '^(?:.*)?';
        }

        preg_match_all('|' . $pattern . '|m', $str, $matches);
        $lines = $matches[0];
        // Remove regex syntax and assume all characters are literal
        if ($escape_regex) {
            for ($i = 0; $i < count($lines); $i++) {
                $lines[$i] = self::esc_regex($lines[$i]);
//              if ($escape_hash || true) {
                // If we have used \#, then we don't want it to become \\#
                $lines[$i] = preg_replace('|\\\\\\\\#|', '\#', $lines[$i]);
//              }
            }
        }

        // Return as string if needed
        if ($return_string) {
            // Add line breaks if they were stripped
            $delimiter = '';
            if ($whitespace) {
                $delimiter = CRAYON_NL;
            }
            $lines = implode($lines, $delimiter);
        }

        return $lines;
    }

    // Returns the contents of a file
    public static function file($path) {
        if (($str = @file_get_contents($path)) === FALSE) {
            return FALSE;
        } else {
            return $str;
        }
    }

    /**
     * Zips a source file or directory.
     *
     * @param $src A directory or file
     * @param $dest A directory or zip file. If a zip file is provided it must exist beforehand.
     */
    public static function createZip($src, $dest, $removeExistingZip = FALSE) {
        if ($src == $dest) {
            throw new InvalidArgumentException("Source '$src' and '$dest' cannot be the same");
        }

        if (is_dir($src)) {
            $src = CrayonUtil::path_slash($src);
            $base = $src;
            // Make sure the destination isn't in the files
            $files = self::getFiles($src, array('recursive' => TRUE, 'ignore' => array($dest)));
        } else if (is_file($src)) {
            $files = array($src);
            $base = dirname($src);
        } else {
            throw new InvalidArgumentException("Source '$src' is not a directory or file");
        }

        if (is_dir($dest)) {
            $dest = CrayonUtil::path_slash($dest);
            $zipFile = $dest . basename($src) . '.zip';
        } else if (is_file($dest)) {
            $zipFile = $dest;
        } else {
            throw new InvalidArgumentException("Destination '$dest' is not a directory or file");
        }

        if ($removeExistingZip) {
            @unlink($zipFile);
        }

        $zip = new ZipArchive;

        if ($zip->open($zipFile, ZIPARCHIVE::CREATE) === TRUE) {
            foreach ($files as $file) {
                $relFile = str_replace($base, '', $file);
                $zip->addFile($file, $relFile);
            }
            $zip->close();
        } else {
            throw new Exception("Could not create zip file at '$zipFile'");
        }

        return $zipFile;
    }

    /**
     * Sends an email in html and plain encodings with a file attachment.
     *
     * @param array $args Arguments associative array
     *      'to' (string)
     *      'from' (string)
     *      'subject' (optional string)
     *      'message' (HTML string)
     *      'plain' (optional plain string)
     *      'file' (optional file path of the attachment)
     * @see http://webcheatsheet.com/php/send_email_text_html_attachment.php
     */
    public static function emailFile($args) {
        $to = self::set_default($args['to']);
        $from = self::set_default($args['from']);
        $subject = self::set_default($args['subject'], '');
        $message = self::set_default($args['message'], '');
        $plain = self::set_default($args['plain'], '');
        $file = self::set_default($args['file']);

        // MIME
        $random_hash = md5(date('r', time()));
        $boundaryMixed = 'PHP-mixed-' . $random_hash;
        $boundaryAlt = 'PHP-alt-' . $random_hash;
        $charset = 'UTF-8';
        $bits = '8bit';

        // Headers
        $headers = "MIME-Version: 1.0";
        $headers .= "Reply-To: $to\r\n";
        if ($from !== NULL) {
            $headers .= "From: $from\r\n";
        }
        $headers .= "Content-Type: multipart/mixed; boundary=$boundaryMixed";
        if ($file !== NULL) {
            $info = pathinfo($file);
            $filename = $info['filename'];
            $extension = $info['extension'];
            $contents = @file_get_contents($file);
            if ($contents === FALSE) {
                throw new Exception("File contents of '$file' could not be read");
            }
            $chunks = chunk_split(base64_encode($contents));
            $attachment = <<<EOT
--$boundaryMixed
Content-Type: application/$extension; name=$filename.$extension
Content-Transfer-Encoding: base64
Content-Disposition: attachment

$chunks
EOT;
        } else {
            $attachment = '';
        }

        $body = <<<EOT
--$boundaryMixed
Content-Type: multipart/alternative; boundary=$boundaryAlt

--$boundaryAlt
Content-Type: text/plain; charset="$charset"
Content-Transfer-Encoding: $bits

$plain

--$boundaryAlt
Content-Type: text/html; charset="$charset"
Content-Transfer-Encoding: $bits

$message
--$boundaryAlt--

$attachment

--$boundaryMixed--
EOT;

        $result = @mail($to, $subject, $body, $headers);
        return $result;
    }

    /**
     * @param $path A directory
     * @param array $args Argument array:
     *      hidden: If true, hidden files beginning with a dot will be included
     *      ignoreRef: If true, . and .. are ignored
     *      recursive: If true, this function is recursive
     *      ignore: An array of paths to ignore
     * @return array Files in the directory
     */
    public static function getFiles($path, $args = array()) {
        $hidden = self::set_default($args['hidden'], TRUE);
        $ignoreRef = self::set_default($args['ignoreRef'], TRUE);
        $recursive = self::set_default($args['recursive'], FALSE);
        $ignore = self::set_default($args['ignore'], NULL);

        $ignore_map = array();
        if ($ignore) {
            foreach ($ignore as $i) {
                if (is_dir($i)) {
                    $i = CrayonUtil::path_slash($i);
                }
                $ignore_map[$i] = TRUE;
            }
        }

        $files = glob($path . '*', GLOB_MARK);
        if ($hidden) {
            $files = array_merge($files, glob($path . '.*', GLOB_MARK));
        }
        if ($ignoreRef || $ignore) {
            $result = array();
            for ($i = 0; $i < count($files); $i++) {
                $file = $files[$i];
                if (!isset($ignore_map[$file]) && (!$ignoreRef || (basename($file) != '.' && basename($file) != '..'))) {
                    $result[] = $file;
                    if ($recursive && is_dir($file)) {
                        $result = array_merge($result, self::getFiles($file, $args));
                    }
                }
            }
        } else {
            $result = $files;
        }
        return $result;
    }

    public static function deleteDir($path) {
        if (!is_dir($path)) {
            throw new InvalidArgumentException("deleteDir: $path is not a directory");
        }
        if (substr($path, strlen($path) - 1, 1) != '/') {
            $path .= '/';
        }
        $files = self::getFiles($path);
        foreach ($files as $file) {
            if (is_dir($file)) {
                self::deleteDir($file);
            } else {
                unlink($file);
            }
        }
        rmdir($path);
    }

    public static function copyDir($src, $dst, $mkdir = NULL) {
        // http://stackoverflow.com/questions/2050859
        if (!is_dir($src)) {
            throw new InvalidArgumentException("copyDir: $src is not a directory");
        }
        $dir = opendir($src);
        if ($mkdir !== NULL) {
            call_user_func($mkdir, $dst);
        } else {
            @mkdir($dst, 0777, TRUE);
        }
        while (false !== ($file = readdir($dir))) {
            if (($file != '.') && ($file != '..')) {
                if (is_dir($src . '/' . $file)) {
                    self::copyDir($src . '/' . $file, $dst . '/' . $file);
                } else {
                    copy($src . '/' . $file, $dst . '/' . $file);
                }
            }
        }
        closedir($dir);
    }

    // Supports arrays in the values
    public static function array_flip($array) {
        $result = array();
        foreach ($array as $k => $v) {
            if (is_array($v)) {
                foreach ($v as $u) {
                    self::_array_flip($result, $k, $u);
                }
            } else {
                self::_array_flip($result, $k, $v);
            }
        }
        return $result;
    }

    private static function _array_flip(&$array, $k, $v) {
        if (is_string($v) || is_int($v)) {
            $array[$v] = $k;
        } else {
            trigger_error("Values must be STRING or INTEGER", E_USER_WARNING);
        }
    }

    // Detects if device is touchscreen or mobile
    public static function is_touch() {
        // Only detect once
        if (self::$touchscreen !== NULL) {
            return self::$touchscreen;
        }
        if (($devices = self::lines(CRAYON_TOUCH_FILE, 'lw')) !== FALSE) {
            if (!isset($_SERVER['HTTP_USER_AGENT'])) {
                return false;
            }
            // Create array of device strings from file
            $user_agent = strtolower($_SERVER['HTTP_USER_AGENT']);
            self::$touchscreen = (self::strposa($user_agent, $devices) !== FALSE);
            return self::$touchscreen;
        } else {
            CrayonLog::syslog('Error occurred when trying to identify touchscreen devices');
        }
    }

    // Removes duplicates in array, ensures they are all strings
    public static function array_unique_str($array) {
        if (!is_array($array) || empty($array)) {
            return array();
        }
        for ($i = 0; $i < count($array); $i++) {
            $array[$i] = strval($array[$i]);
        }
        return array_unique($array);
    }

    // Same as array_key_exists, but returns the key when exists, else FALSE;
    public static function array_key_exists($key, $array) {
        if (!is_array($array) || empty($array) || !is_string($key) || empty($key)) {
            FALSE;
        }
        if (array_key_exists($key, $array)) {
            return $array[$key];
        }
    }

    // Performs explode() on a string with the given delimiter and trims all whitespace
    public static function trim_e($str, $delimiter = ',') {
        if (is_string($delimiter)) {
            $str = trim(preg_replace('|\s*(?:' . preg_quote($delimiter) . ')\s*|', $delimiter, $str));
            return explode($delimiter, $str);
        }
        return $str;
    }

    /*  Creates an array of integers based on a given range string of format "int - int"
     Eg. range_str('2 - 5'); */
    public static function range_str($str) {
        preg_match('#(\d+)\s*-\s*(\d+)#', $str, $matches);
        if (count($matches) == 3) {
            return range($matches[1], $matches[2]);
        }
        return FALSE;
    }

    // Creates an array out of a single range string (e.i "x-y")
    public static function range_str_single($str) {
        $match = preg_match('#(\d+)(?:\s*-\s*(\d+))?#', $str, $matches);
        if ($match > 0) {
            if (empty($matches[2])) {
                $matches[2] = $matches[1];
            }
            if ($matches[1] <= $matches[2]) {
                return array($matches[1], $matches[2]);
            }
        }
        return FALSE;
    }

    // Sets a variable to a string if valid
    public static function str(&$var, $str, $escape = TRUE) {
        if (is_string($str)) {
            $var = ($escape == TRUE ? self::htmlentities($str) : $str);
            return TRUE;
        }
        return FALSE;
    }

    // Converts all special characters to entities
    public static function htmlentities($str) {
        return htmlentities($str, ENT_COMPAT, 'UTF-8');
    }

    public static function html_entity_decode($str) {
        return html_entity_decode($str, ENT_QUOTES, 'UTF-8');
    }

    // Converts <, >, & into entities
    public static function htmlspecialchars($str) {
        return htmlspecialchars($str, ENT_NOQUOTES, 'UTF-8');
    }

    // Sets a variable to an int if valid
    public static function num(&$var, $num) {
        if (is_numeric($num)) {
            $var = intval($num);
            return TRUE;
        }
        return FALSE;
    }

    // Sets a variable to an array if valid
    public static function arr(&$var, $array) {
        if (is_array($array)) {
            $var = $array;
            return TRUE;
        }
        return FALSE;
    }

    // Sets a variable to an array if valid
    public static function set_array($var, $array, $false = FALSE) {
        return isset($array[$var]) ? $array[$var] : $false;
    }

    // Sets a variable to null if not set
    public static function set_var(&$var, $false = NULL) {
        $var = isset($var) ? $var : $false;
    }

    // Sets a variable to null if not set
    public static function set_default(&$var, $default = NULL) {
        return isset($var) ? $var : $default;
    }

    public static function set_default_null($var, $default = NULL) {
        return $var !== NULL ? $var : $default;
    }

    // Thanks, http://www.php.net/manual/en/function.str-replace.php#102186
    function str_replace_once($str_pattern, $str_replacement, $string) {
        if (strpos($string, $str_pattern) !== FALSE) {
            $occurrence = strpos($string, $str_pattern);
            return substr_replace($string, $str_replacement, strpos($string, $str_pattern), strlen($str_pattern));
        }
        return $string;
    }

    // Removes non-numeric chars in string
    public static function clean_int($str, $return_zero = TRUE) {
        $str = preg_replace('#[^\d]#', '', $str);
        if ($return_zero) {
            // If '', then returns 0
            return strval(intval($str));
        } else {
            // Might be ''
            return $str;
        }
    }

    // Replaces whitespace with hypthens
    public static function space_to_hyphen($str) {
        return preg_replace('#\s+#', '-', $str);
    }

    // Replaces hypthens with spaces
    public static function hyphen_to_space($str) {
        return preg_replace('#-#', ' ', $str);
    }

    // Remove comments with /* */, // or #, if they occur before any other char on a line
    public static function clean_comments($str) {
        $comment_pattern = '#(?:^\s*/\*.*?^\s*\*/)|(?:^(?!\s*$)[\s]*(?://|\#)[^\r\n]*)#ms';
        $str = preg_replace($comment_pattern, '', $str);
        return $str;
    }

    // Convert to title case and replace underscores with spaces
    public static function ucwords($str) {
        $str = strval($str);
        $str = str_replace('_', ' ', $str);
        return ucwords($str);
    }

    // Escapes regex characters as literals
    public static function esc_regex($regex) {
        return /*htmlspecialchars(*/
            preg_quote($regex) /* , ENT_NOQUOTES)*/
            ;
    }

    // Escapes hash character as literals
    public static function esc_hash($regex) {
        if (is_string($regex)) {
            return preg_replace('|(?<!\\\\)#|', '\#', $regex);
        } else {
            return FALSE;
        }
    }

    // Ensure all parenthesis are atomic to avoid conflicting with element matches
    public static function esc_atomic($regex) {
        return preg_replace('#(?<!\\\\)\((?!\?)#', '(?:', $regex);
    }

    // Returns the current HTTP URL
    public static function current_url() {
        $p = self::isSecure() ? "https://" : "http://";
        return $p . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
    }

    // Removes crayon plugin path from absolute path
    public static function path_rel($url) {
        if (is_string($url)) {
            return str_replace(CRAYON_ROOT_PATH, '/', $url);
        }
        return $url;
    }

    // Returns path according to detected use of forwardslash/backslash
    // Deprecated from regular use after v.1.1.1
    public static function path($path, $detect) {
        $slash = self::detect_slash($detect);
        return str_replace(array('\\', '/'), $slash, $path);
    }

    // Detect which kind of slash is being used in a path
    public static function detect_slash($path) {
        if (strpos($path, '\\')) {
            // Windows
            return $slash = '\\';
        } else {
            // UNIX
            return $slash = '/';
        }
    }

    // Returns path using forward slashes
    public static function pathf($url) {
        return str_replace('\\', '/', trim(strval($url)));
    }

    // Returns path using back slashes
    public static function pathb($url) {
        return str_replace('/', '\\', trim(strval($url)));
    }

    // returns 'true' or 'false' depending on whether this PHP file was served over HTTPS
    public static function isSecure() {
        // From https://core.trac.wordpress.org/browser/tags/4.0.1/src/wp-includes/functions.php
        if ( isset($_SERVER['HTTPS']) ) {
            if ( 'on' == strtolower($_SERVER['HTTPS']) )
                return true;
            if ( '1' == $_SERVER['HTTPS'] )
                return true;
        } elseif ( isset($_SERVER['SERVER_PORT']) && ( '443' == $_SERVER['SERVER_PORT'] ) ) {
            return true;
        }
        return false;
    }

    public static function startsWith($haystack, $needle) {
        return substr($haystack, 0, strlen($needle)) === $needle;
    }

    // Append either forward slash or backslash based on environment to paths
    public static function path_slash($path) {
        $path = self::pathf($path);
        if (!empty($path) && !preg_match('#\/$#', $path)) {
            $path .= '/';
        }
        if (self::startsWith($path, 'http://') && self::isSecure()) {
            $path = str_replace('http://', 'https://', $path);
        }
        return $path;
    }

    public static function path_slash_remove($path) {
        return preg_replace('#\/+$#', '', $path);
    }

    // Append a forward slash to a path if needed
    public static function url_slash($url) {
        $url = self::pathf($url);
        if (!empty($url) && !preg_match('#\/$#', $url)) {
            $url .= '/';
        }
        if (self::startsWith($url, 'http://') && self::isSecure()) {
            $url = str_replace('http://', 'https://', $url);
        }
        return $url;
    }

    // Removes extension from file path
    public static function path_rem_ext($path) {
        $path = self::pathf($path);
        return preg_replace('#\.\w+$#m', '', $path);
    }

    // Shorten a URL into a string of given length, used to identify a URL uniquely
    public static function shorten_url_to_length($url, $length) {
        if ($length < 1) {
            return '';
        }
        $url = preg_replace('#(^\w+://)|([/\.])#si', '', $url);
        if (strlen($url) > $length) {
            $diff = strlen($url) - $length;
            $rem = floor(strlen($url) / $diff);
            $rem_count = 0;
            for ($i = $rem - 1; $i < strlen($url) && $rem_count < $diff; $i = $i + $rem) {
                $url[$i] = '.';
                $rem_count++;
            }
            $url = preg_replace('#\.#s', '', $url);
        }
        return $url;
    }

    // Creates a unique ID from a string
    public static function get_var_str() {
        $get_vars = array();
        foreach ($_GET as $get => $val) {
            $get_vars[] = $get . '=' . $val;
        }
        return implode($get_vars, '&');
    }

    // Creates a unique ID from a string
    public static function str_uid($str) {
        $uid = 0;
        for ($i = 1; $i < strlen($str); $i++) {
            $uid += round(ord($str[$i]) * ($i / strlen($str)), 2) * 100;
        }
        return strval(dechex(strlen($str))) . strval(dechex($uid));
    }

    // Breaks up a version string into parts
    public static function version_parts($version) {
        preg_match('#[\d+\.]+#msi', $version, $match);
        if (count($match[0])) {
            return explode('.', $match[0]);
        } else {
            return array();
        }
    }

    // Compares two version strings lexicographically
    public static function version_compare($a, $b) {
        $a_parts = self::version_parts($a);
        $b_parts = self::version_parts($b);
        return self::array_compare_lexi($a_parts, $b_parts);
    }

    // Compares two arrays lexicographically
    // This could be extended with a compare function argument
    public static function array_compare_lexi($a, $b) {
        $short = count($a) < count($b) ? $a : $b;
        for ($i = 0; $i < count($short); $i++) {
            if ($a[$i] > $b[$i]) {
                return 1;
            } else if ($a[$i] < $b[$i]) {
                return -1;
            }
        }
        return 0;
    }

    // strpos with an array of $needles
    public static function strposa($haystack, $needles, $insensitive = FALSE) {
        if (is_array($needles)) {
            foreach ($needles as $str) {
                if (is_array($str)) {
                    $pos = self::strposa($haystack, $str, $insensitive);
                } else {
                    $pos = $insensitive ? stripos($haystack, $str) : strpos($haystack, $str);
                }
                if ($pos !== FALSE) {
                    return $pos;
                }
            }
            return FALSE;
        } else {
            return strpos($haystack, $needles);
        }
    }

    // tests if $needle is equal to any strings in $haystack
    public static function str_equal_array($needle, $haystack, $case_insensitive = TRUE) {
        if (!is_string($needle) || !is_array($haystack)) {
            return FALSE;
        }
        if ($case_insensitive) {
            $needle = strtolower($needle);
        }
        foreach ($haystack as $hay) {
            if (!is_string($hay)) {
                continue;
            }
            if ($case_insensitive) {
                $hay = strtolower($hay);
            }
            if ($needle == $hay) {
                return TRUE;
            }
        }
        return FALSE;
    }

    // Support for singular and plural string variations
    public static function spnum($int, $singular, $plural = NULL) {
        if (!is_int($int) || !is_string($singular)) {
            $int = intval($int);
            $singular = strval($singular);
        }
        if ($plural == NULL || !is_string($plural)) {
            $plural = $singular . 's';
        }
        return $int . ' ' . (($int == 1) ? $singular : $plural);
    }

    // Turn boolean into Yes/No
    public static function bool_yn($bool) {
        return $bool ? 'Yes' : 'No';
    }

    // String to boolean, default decides what boolean value to return when not found
    public static function str_to_bool($str, $default = TRUE) {
        $str = self::tlower($str);
        if ($default === FALSE) {
            if ($str == 'true' || $str == 'yes' || $str == '1') {
                return TRUE;
            } else {
                return FALSE;
            }
        } else {
            if ($str == 'false' || $str == 'no' || $str == '0') {
                return FALSE;
            } else {
                return TRUE;
            }
        }
    }

    public static function bool_to_str($bool, $strict = FALSE) {
        if ($strict) {
            return $bool === TRUE ? 'true' : 'false';
        } else {
            return $bool ? 'true' : 'false';
        }
    }

    public static function tlower($str) {
        return trim(strtolower($str));
    }

    // Escapes $ and \ from the replacement to avoid becoming a backreference
    public static function preg_replace_escape_back($pattern, $replacement, $subject, $limit = -1, &$count = 0) {
        return preg_replace($pattern, self::preg_escape_back($replacement), $subject, $limit, $count);
    }

    // Escape backreferences from string for use with regex
    public static function preg_escape_back($string) {
        // Replace $ with \$ and \ with \\
        $string = preg_replace('#(\\$|\\\\)#', '\\\\$1', $string);
        return $string;
    }

    // Detect if on a Mac or PC
    public static function is_mac($default = FALSE) {
        $user = $_SERVER['HTTP_USER_AGENT'];
        if (stripos($user, 'macintosh') !== FALSE) {
            return TRUE;
        } else if (stripos($user, 'windows') !== FALSE || stripos($user, 'linux') !== FALSE) {
            return FALSE;
        } else {
            return $default === TRUE;
        }
    }

    // Decodes WP html entities
    public static function html_entity_decode_wp($str) {
        if (!is_string($str) || empty($str)) {
            return $str;
        }
        // http://www.ascii.cl/htmlcodes.htm
        $wp_entities = array('&#8216;', '&#8217;', '&#8218;', '&#8220;', '&#8221;');
        $wp_replace = array('\'', '\'', ',', '"', '"');
        $str = str_replace($wp_entities, $wp_replace, $str);
        return $str;
    }

    // Constructs an html element
    // If $content = FALSE, then element is closed
    public static function html_element($name, $content = NULL, $attributes = array()) {
        $atts = self::html_attributes($attributes);
        $tag = "<$name $atts";
        $tag .= $content === FALSE ? '/>' : ">$content</$name>";
        return $tag;
    }

    public static function html_attributes($attributes, $assign = '=', $quote = '"', $glue = ' ') {
        $atts = '';
        foreach ($attributes as $k => $v) {
            $atts .= $k . $assign . $quote . $v . $quote . $glue;
        }
        return $atts;
    }

    // Strips only the given tags in the given HTML string.
    public static function strip_tags_blacklist($html, $tags) {
        foreach ($tags as $tag) {
            $regex = '#<\s*\b' . $tag . '\b[^>]*>.*?<\s*/\s*'. $tag . '\b[^>]*>?#msi';
            $html = preg_replace($regex, '', $html);
        }
        return $html;
    }

    // Strips the given attributes found in the given HTML string.
    public static function strip_attributes($html, $atts) {
        foreach ($atts as $att) {
            $regex = '#\b' . $att . '\b(\s*=\s*[\'"][^\'"]*[\'"])?(?=[^<]*>)#msi';
            $html = preg_replace($regex, '', $html);
        }
        return $html;
    }

    // Strips all event attributes on DOM elements (prefixe with "on").
    public static function strip_event_attributes($html) {
        $regex = '#\bon\w+\b(\s*=\s*[\'"][^\'"]*[\'"])?(?=[^<]*>)#msi';
        return preg_replace($regex, '', $html);
    }

}

?>
