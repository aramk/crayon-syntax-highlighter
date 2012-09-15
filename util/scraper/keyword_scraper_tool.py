import sys
import keyword_scraper

'''
Invokes keyword_scraper over command line
	
Example:

	$ python keyword_scraper_tool.py geshi_lang_file.php somedir
'''

if len(sys.argv) < 2:
	print "Usage: keyword_scraper_tool <inputfile> [directory]"
	exit()
else:
	infile = sys.argv[1]
	outdir = sys.argv[2] if len(sys.argv) >= 3 else None
	keyword_scraper.keywords(infile, outdir)
