import sys

'''
Concatenates all arguments together, assuming they are files, into the last argument file.
'''

if len(sys.argv) < 4:
	print "Usage: file_concat.py <inputfile1>, <inputfile2>, ...  <outputfile>"
	exit()
else:
	ins = sys.argv[1:-1]
	out = sys.argv[-1]
	outfile = open(out, 'w')

	all_lines = []
	for i in ins:
		f = open(i, 'r')
		lines = [x.strip() for x in f.readlines()]
		all_lines += lines

	outfile.write('\n'.join(all_lines))
