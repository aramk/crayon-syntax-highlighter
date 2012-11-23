import sys
import keyword_scraper

'''
Invokes keyword_scraper to sort a file of keywords
	
Example:

	$ python keyword_scraper_tool.py geshi_lang_file.php somedir
'''

if len(sys.argv) < 2:
	print "Usage: keyword_scraper_tool <inputfile> <outputfile>"
	exit()
else:
	infile_ = sys.argv[1]
	outfile_ = sys.argv[2] if len(sys.argv) >= 3 else None

	infile = open(infile_, 'r')
	keywords = [x.strip() for x in infile.readlines()]
	keywords.sort(keyword_scraper.cmp_keywords)

	if outfile_:
		outfile = open(outfile_, 'w')
		outfile.write('\n'.join(keywords))
	
