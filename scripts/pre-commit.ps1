Write-Host "Running generate_word_counts.py..."

$process = Start-Process -FilePath "python" -ArgumentList "generate_word_counts.py" -NoNewWindow -Wait -PassThru

if ($process.ExitCode -ne 0) {
    Write-Host "Python script failed. Aborting commit."
    exit 1
}

git add data/blog-word-count.json

Write-Host "Word count JSON updated and staged."