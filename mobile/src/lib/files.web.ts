/* The browser preview of the phone app has no file system, so photos are kept as data URLs. */

const toDataUrl = async (uri: string) => {
  if (uri.startsWith('data:')) return uri;
  const blob = await (await fetch(uri)).blob();
  return new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
};

export const asFile = (uri: string, _name: string) => uri;
export const keepImage =(_id: string, uri: string, _size?: { width: number; height: number }) => toDataUrl(uri);
export const uriFor = (ref: string) => ref;
export const dropImage = (_ref: string) => {};
export const clearImages = () => {};
export const imageAsDataUrl = async (ref: string) => ref;

export async function shareJson(name: string, json: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

export const readText = async (uri: string) => (await fetch(uri)).text();
