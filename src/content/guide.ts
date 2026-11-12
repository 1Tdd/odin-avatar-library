export const paths = [
  {id: 'start', label: 'Start from scratch'},
  {id: 'cloud', label: 'Save to pCloud'},
  {id: 'manual', label: 'Manual upload'},
  {id: 'selected', label: 'Selected packs'},
  {id: 'update', label: 'Update a library'},
];

export const chapters = ['What you need', 'Choose your packs', 'Get the files', 'Check the structure', 'Connect Odin', 'Add the packs', 'Choose your avatar'];

/** pCloud's WebDAV endpoints. The region is fixed when the pCloud account is created. */
export const webdav = {eu: 'https://ewebdav.pcloud.com', us: 'https://webdav.pcloud.com'};

export const adding: Record<string, {title: string; steps: string[]}> = {
  start: {
    title: 'Start with a complete copy',
    steps: [
      'Choose Add to pCloud to copy the shared folder inside pCloud, or download the complete library ZIP for manual upload. These are two ways to obtain the same collection.',
      'Keep the main folder named ODIN_PROFILE_AVATARS. Do not add another folder with that name inside it.',
      'Wait until copying or uploading has completed. Open a few images from different packs on pCloud before importing anything in Odin.',
    ],
  },
  cloud: {
    title: 'Save the shared library to your pCloud',
    steps: [
      'Choose Add to pCloud on this website, read the short explanation, then continue to the public share. Opening the share alone does not copy anything.',
      'Choose pCloud’s save-to-account action. In a signed-out session it opens a sign-in prompt. Authenticate on pCloud, never on this website. The wording follows your pCloud language.',
      'Follow pCloud’s prompts to choose or confirm the destination. Check the destination shown before confirming.',
      'Return to your own pCloud file manager and verify that ODIN_PROFILE_AVATARS is present and populated. A copied link or an open browser tab is not proof of a completed copy.',
    ],
  },
  manual: {
    title: 'Download, extract, then upload',
    steps: [
      'Download the complete library ZIP. Keep enough local space for both the archive and its extracted contents — about 6 GB for this release.',
      'Extract the ZIP on your computer. On Windows use Extract All; on other systems use the built-in archive utility.',
      'Upload the extracted ODIN_PROFILE_AVATARS folder to your pCloud account or another WebDAV storage. Uploading only the ZIP does not make its images available to Odin.',
      'Wait for every upload to finish. If some files failed, retry those files first instead of deleting and uploading the whole collection again.',
    ],
  },
  selected: {
    title: 'Install only the packs you want',
    steps: [
      'While browsing, press the + on each pack you like. Open My selection and choose Download selection ZIP — it contains every chosen image folder with its manifest. A single pack can also be downloaded from its own page.',
      'Extract the ZIP into your ODIN_PROFILE_AVATARS folder, or create that folder if this is your first pack. Keep each image folder and the pack JSON beside it together.',
      'Upload the image folders and their manifests to the same location on your storage. A manifest-only download is enough only when that image folder is already complete.',
      'Adding more packs later works the same way: extract the new ZIP into the same folder and upload the new items.',
    ],
  },
  update: {
    title: 'Update without losing track of working files',
    steps: [
      'Keep a backup of your working library and note your installed packs and current profile pictures before changing files. Check that the backup actually opens.',
      'Compare the release contents. A metadata-only update has JSON and possibly CSV files, but no images. It can only update names and references when the referenced images already exist.',
      'For unchanged filenames, merge the affected folders and replace the intended manifests. For renamed images, upload the new files and their matching manifests together. Overlaying renamed files leaves the old filenames behind.',
      'Do not assume that deleting and recreating a folder with the same name preserves Odin’s imported references. Prefer a controlled update and verify a small pack first.',
      'Re-add affected packs if images or names do not update. Remove old duplicate files only after every affected reference and profile picture is verified.',
    ],
  },
};

export const pathIntroductions: Record<string, {title: string; description: string; first: string}> = {
  start: {
    title: 'Set up your first avatar library',
    description: 'Get the files onto your storage, connect that storage to Odin, then add the packs you like.',
    first: 'New here? Follow the chapters in order. You can choose between a pCloud copy and a manual upload in chapter 3.',
  },
  cloud: {
    title: 'Copy the library to your pCloud account',
    description: 'Save the shared folder directly in pCloud, check the copied files, then add your chosen packs in Odin.',
    first: 'Have your pCloud account ready with at least 3 GB free. Chapter 3 opens the shared library; sign in on pCloud and confirm where to save it.',
  },
  manual: {
    title: 'Download, extract and upload the library',
    description: 'Keep a local copy of the files and upload the extracted folder to your own storage.',
    first: 'Allow about 6 GB on your computer for the ZIP and extracted files, plus at least 3 GB on your storage. Chapter 3 explains extraction and upload.',
  },
  selected: {
    title: 'Add only the packs you want',
    description: 'Collect packs in your selection, download them as one ZIP, and place them in your library folder.',
    first: 'Choose your packs in the catalog first. Storage needs depend on what you select — most packs are only a few megabytes.',
  },
  update: {
    title: 'Update an existing library safely',
    description: 'Replace only the files that need updating, preserve working paths, and verify affected packs before removing anything.',
    first: 'Back up the current library and note your installed packs and profile pictures. Chapter 3 explains how to handle changed filenames and manifests.',
  },
};
