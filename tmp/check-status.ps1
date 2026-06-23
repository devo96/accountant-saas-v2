$json = Invoke-RestMethod -Uri 'https://api.github.com/repos/devo96/accountant-saas-v2/commits/8e28bb8/statuses' -Headers @{'User-Agent'='PowerShell'}
foreach ($item in $json) {
  Write-Output ($item.context + ': ' + $item.state + ' - ' + $item.description)
}
