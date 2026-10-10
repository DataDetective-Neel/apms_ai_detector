export async function readUploadResponse(response: Response) {
  if (response.status === 413) {
    throw new Error('This photograph exceeds the server upload limit. Reduce its file size and try again.');
  }

  const body = await response.text();
  let data;
  try {
    data = JSON.parse(body);
  } catch {
    throw new Error(`The upload server returned an invalid response (HTTP ${response.status}). Please try again.`);
  }

  if (!response.ok || !data || data.success !== true) {
    throw new Error(data?.error || `Upload request failed (HTTP ${response.status}).`);
  }
  return data;
}
