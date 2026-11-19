Add-Type -AssemblyName System.Runtime.WindowsRuntime
[Windows.Storage.StorageFile, Windows.Storage, ContentType=WindowsRuntime] | Out-Null
[Windows.Data.Pdf.PdfDocument, Windows.Data.Pdf, ContentType=WindowsRuntime] | Out-Null
[Windows.Storage.Streams.InMemoryRandomAccessStream, Windows.Storage.Streams, ContentType=WindowsRuntime] | Out-Null

$pdf1 = "C:\Users\Admin\.gemini\antigravity\brain\79a05bf1-b386-41da-ac7d-487d6ab0eb0b\.user_uploaded\media_1795084018228_5ce4f4c2.pdf"
$pdf2 = "C:\Users\Admin\.gemini\antigravity\brain\79a05bf1-b386-41da-ac7d-487d6ab0eb0b\.user_uploaded\media_1795084031514_5054ec57.pdf"

$asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { 
    $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 
} | Select-Object -First 1

$asTaskAction = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { 
    $_.Name -eq 'AsTask' -and -not $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 
} | Select-Object -First 1

function Render-Pdf($inputPdf, $outputPng, $scale = 2.0) {
    Write-Host "Rendering $inputPdf -> $outputPng..."
    $fs = [System.IO.File]::OpenRead($inputPdf)
    $ras = [System.IO.WindowsRuntimeStreamExtensions]::AsRandomAccessStream($fs)
    
    $docOp = [Windows.Data.Pdf.PdfDocument]::LoadFromStreamAsync($ras)
    $docTask = $asTaskGeneric.MakeGenericMethod([Windows.Data.Pdf.PdfDocument]).Invoke($null, @($docOp))
    $doc = $docTask.GetAwaiter().GetResult()
    
    $page = $doc.GetPage(0)
    $renderOptions = New-Object Windows.Data.Pdf.PdfPageRenderOptions
    $renderOptions.DestinationWidth = [uint32]($page.Size.Width * $scale)
    $renderOptions.DestinationHeight = [uint32]($page.Size.Height * $scale)
    
    $memStream = New-Object Windows.Storage.Streams.InMemoryRandomAccessStream
    $renderOp = $page.RenderToStreamAsync($memStream, $renderOptions)
    $renderTask = $asTaskAction.Invoke($null, @($renderOp))
    $renderTask.GetAwaiter().GetResult()
    
    $netStream = [System.IO.WindowsRuntimeStreamExtensions]::AsStream($memStream)
    $outFile = [System.IO.File]::Create($outputPng)
    $netStream.Seek(0, [System.IO.SeekOrigin]::Begin)
    $netStream.CopyTo($outFile)
    $outFile.Close()
    $netStream.Close()
    $memStream.Dispose()
    $fs.Close()
    Write-Host "SUCCESS: $outputPng created, size: " (Get-Item $outputPng).Length "bytes"
}

Render-Pdf $pdf1 "C:\Users\Admin\.gemini\antigravity\scratch\flashdrop\docs\chen_er_diagram.png" 3.0
Render-Pdf $pdf2 "C:\Users\Admin\.gemini\antigravity\scratch\flashdrop\docs\relational_schema.png" 3.0
