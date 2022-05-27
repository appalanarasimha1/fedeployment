export function createDownloadQuery() {
  return [
    {
      $match: {
        eventId: "download",
        "extended.downloadReason": "download",
        "extended.blobXPath": "file:content",
        docType: { $in: ["Video", "Picture", "File"] },
      },
    },
    {
      $group: {
        _id: { type: "$docType", user: "$principalName" },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.user",
        countType: { $push: { type: "$_id.type", count: "$count" } },
      },
    },
    {
      $sort: {
        countType: -1,
      },
    },
  ];
}

export function createPreviewQuery() {
  return [
    {
      $match: {
        eventId: "download",
        $or: [
          { "extended.downloadReason": "preview" },
          { "extended.blobXPath": { $nin: ["file:content"] } },
        ],
        docType: { $in: ["Video", "Picture", "File"] },
      },
    },
    {
      $group: {
        _id: { type: "$docType", user: "$principalName" },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.user",
        countType: { $push: { type: "$_id.type", count: "$count" } },
      },
    },
    {
      $sort: {
        countType: -1,
      },
    },
  ];
}

export function createUploadQuery() {
  return [
    {
      $match: {
        eventId: "documentCreated",
        docType: { $in: ["Video", "Picture", "File"] },
      },
    },
    {
      $group: {
        _id: { type: "$docType", user: "$principalName" },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.user",
        countType: { $push: { type: "$_id.type", count: "$count" } },
      },
    },
    {
      $sort: {
        countType: -1,
      },
    },
  ];
}

export function getSectorReport() {
  return [
    {
      $match: {
        "ecm:primaryType": { $in: ["Video", "Picture", "File"] },
      },
    },
    {
      $group: {
        _id: "$dc:sector" ,
        count: { $sum: 1 },
      },
    },
    {
      $match: {
        _id: {
          $ne: null,
        },
      },
    },
    {
      $addFields: { name: "$_id" },
    },
    {
      $project: { _id: 0 },
    },

    {
      $sort: {
        count: -1,
      },
    },
  ];
}
