#$imageName = 'aaa.png'
#$imageFolder = 'D:\Doc\ps\aaa\'
param($imageFolder,$imageName)

$imagePath = $imageFolder + '/' +$imageName;

Add-Type -Assembly PresentationCore
$hasImage = [Windows.Clipboard]::ContainsImage()
$hasDropFile = [Windows.Clipboard]::ContainsFileDropList()

if ($hasImage -eq $false -and $hasDropFile -eq $false  ) {
    "no image"
    Exit 1
}

if ($hasImage -eq $true ) {
    $img = [Windows.Clipboard]::GetImage()
    $fcb = new-object Windows.Media.Imaging.FormatConvertedBitmap($img, [Windows.Media.PixelFormats]::Rgb24, $null, 0)
    $stream = [IO.File]::Open($imagePath, "OpenOrCreate")
    $encoder = New-Object Windows.Media.Imaging.PngBitmapEncoder
    $encoder.Frames.Add([Windows.Media.Imaging.BitmapFrame]::Create($fcb)) | out-null
    $encoder.Save($stream) | out-null
    $stream.Dispose() | out-null

    $imageName
}

if($hasDropFile -eq $true){
    $existFolder=[IO.Directory]::Exists($imageFolder)
    if($existFolder -eq $false){
        [IO.Directory]::CreateDirectory($imageFolder)
    }
    $fileList = [Windows.Clipboard]::GetFileDropList()
    #$fileList    
    $files=''
    foreach($file in  $fileList){
        $fileName= [IO.Path]::GetFileName($file)        
        [IO.File]::Copy($file,$imageFolder+'/'+$fileName,$true);
        if($files){
            $files+=','+$fileName
        }else{
            $files=$fileName
        }      
    }

    $files
}
'#'