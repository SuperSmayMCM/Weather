zip:
	rm weather.zip
	zip -r weather.zip . -x makefile -x ".git*"