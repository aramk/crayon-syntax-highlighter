import re
import os

def cmp_keywords(x,y):
	'''
	Sorts keywords by length, and then alphabetically
	'''
	if len(x) < len(y):
		return 1
	elif len(x) == len(y):
		# Sort alphabetically
		if x == y:
			return 0
		elif x < y:
			return -1
		else:
			return 1
	else:
		return -1

def keywords(infile, outdir):
	'''
	Scrapes comma separated keywords out of a file and sorts them in descending order of length.
	It is assumed a keyword is surrounded in quotes ('' or ""), are grouped by commas and separated by line breaks.
	The output is then printed and each group is written in text files in the given directory

	An example use case for this is scraping keywords out of GeSHi language files:

		>>> keywords('geshi_lang_file.php', 'somedir')

	'''
	if outdir and not os.path.exists(outdir):
		os.makedirs(outdir)

	f = open(infile, 'r')
	fs = f.read()
	fs = re.sub(r"(//.*?[\r\n])|(/\*.*?\*/)", '', fs)

	matches = re.findall(r"(?:(?:'[^']+'|\"[^\"]+\")(?:[ \t]*[\r\n]?[ \t]*,[ \t]*[\r\n]?[ \t]*)?(?!\s*=>)){2,}", fs, flags=re.I | re.M | re.S)
	output = ''
	group = 0
	for i in matches:
		match = re.findall(r"'([^']+)'", i, flags=re.I | re.M | re.S)
		match.sort(cmp=cmp_keywords)
		suboutput = ''
		for m in match:
			m = m.strip()
			if len(m) > 0:
				suboutput += m + '\n'
		suboutput += '\n'
		if outdir:
			w = open(outdir + '/' + str(group) + '.txt' , 'w')
			w.write(suboutput)
		output += suboutput
		group += 1;

	print output

	exit()
	matches = re.findall(r"(['\"])(.*?)\1", fs, re.I | re.M | re.S)
	output = ''
	if len(matches):
		for m in matches:
			s = m[1].strip()
			if len(s) > 0:
				output += s + '\n'
	f.close()
	print output
	if w:
		w.write(output)
		w.close()


