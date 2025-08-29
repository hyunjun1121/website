@echo off
echo Copying images from input to assets folder...
xcopy "E:\Project\website\input\*.*" "E:\Project\website\assets\" /Y /I
echo Images copied successfully!
pause