import { Tags } from "./types";

function padStart(
  str: string,
  targetLength: number,
  padString: string
): string {
  let result = str;
  while (result.length < targetLength) {
    result = padString + result;
  }
  return result;
}

export function parseVersionString(version: string | number): number {
  const osVersionParts = version.toString().split(".");
  const majorVersion = padStart(osVersionParts[0], 2, "0");
  let minorVersion: string;
  if (osVersionParts[1]) {
    minorVersion = padStart(osVersionParts[1], 2, "0");
  } else {
    minorVersion = "00";
  }

  return Number(`${majorVersion}.${minorVersion}`);
}

export const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export function addTags(tags1: Tags, tags2: Tags): Tags {
  const arrayTags1 = Object.entries(tags1);
  const arrayTags2 = Object.entries(tags2);
  const setTags1 = new Set(arrayTags1);
  for (let elem of arrayTags2) {
    setTags1.add(elem);
  }
  let obj: Tags = Object.fromEntries(setTags1);
  return obj;
}

export function deleteTags(tags1: Tags, tags2: Tags): Tags {
  let diff = Object.keys(tags1).reduce((diff, key) => {
    if (tags1[key] === tags2[key]) return diff;
    return {
      ...diff,
      [key]: tags1[key],
    };
  }, {});
  return diff;
}
