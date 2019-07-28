import sys
import cv2
import os
import urllib.request

def process(): 
	in_path = sys.argv[1]
	out_path = sys.argv[2]
	print(in_path)
	print(out_path)
	# Retrieve the image from path
	img = cv2.imread(in_path)
	if img is None:
		return False, "Image Failed to Load"

	# Apply the Canny edge detection filter
	filtered = cv2.Canny(img, 50, 50)
	if filtered is None:
		return False, "Image Failed To Filter"

	# Write the image back to disk
	out = cv2.imwrite(out_path, filtered)
	if out == False:
		return False, "Image Failed To Write"

	return True, "Success"

isSuccess, message = process()
print(isSuccess)
print(message)
sys.stdout.flush()