export const cloudinaryUpload = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "peakfuel_products"); // create this in Cloudinary dashboard
  formData.append("folder", "peakfuel");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "Upload failed");
  const url: string = data.secure_url;
  const transformedUrl = url.replace(
    "/upload/",
    "/upload/c_fill,g_auto,w_800,h_800,q_auto/",
  );

  return transformedUrl;
};
