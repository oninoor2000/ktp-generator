import type { KTAGeneratedData } from "@/lib/types/kta-types";
import type { KTPGeneratedData } from "@/lib/types/ktp-types";

/**
 * Check if the data is KTA data
 * @param data - The data to check
 * @returns True if the data is KTA data, false otherwise
 */
function isKtaData(
  data: KTPGeneratedData | KTAGeneratedData,
): data is KTAGeneratedData {
  return (
    "familyCertificateNumber" in data &&
    "headFamilyName" in data &&
    "birthCertificateNumber" in data
  );
}

/**
 * Export data to Excel
 * @param data - The data to export
 * @returns A promise that resolves when the export is complete
 */
export async function exportToExcel(
  data: KTPGeneratedData[] | KTAGeneratedData[],
): Promise<void> {
  if (data.length === 0) return;

  const isKTA = isKtaData(data[0]);

  const KTPHeader = [
    "nik",
    "name",
    "birthDate",
    "birthPlace",
    "gender",
    "address",
    "rt",
    "rw",
    "village",
    "district",
    "city",
    "province",
    "religion",
    "maritalStatus",
    "occupation",
    "bloodType",
    "nationality",
    "validityPeriod",
  ];

  const KTAHeader = [
    "nik",
    "name",
    "birthDate",
    "birthPlace",
    "gender",
    "address",
    "rt",
    "rw",
    "village",
    "district",
    "city",
    "province",
    "religion",
    "bloodType",
    "familyCertificateNumber",
    "headFamilyName",
    "birthCertificateNumber",
    "nationality",
    "validityPeriod",
  ];

  const header = isKTA ? KTAHeader : KTPHeader;

  // Create CSV content
  const csvContent = [
    header.join(","),
    ...data.map((item) => {
      if (isKTA) {
        const KTAItem = item as KTAGeneratedData;
        return [
          `"=""${KTAItem.nik}"""`,
          `"${KTAItem.name}"`,
          `"=""${KTAItem.birthDate}"""`,
          `"${KTAItem.birthPlace}"`,
          `"${KTAItem.gender}"`,
          `"${KTAItem.address}"`,
          `"${KTAItem.rt}"`,
          `"${KTAItem.rw}"`,
          `"${KTAItem.village}"`,
          `"${KTAItem.district}"`,
          `"${KTAItem.city}"`,
          `"${KTAItem.province}"`,
          `"${KTAItem.religion}"`,
          `"${KTAItem.bloodType}"`,
          `"=""${KTAItem.familyCertificateNumber}"""`,
          `"${KTAItem.headFamilyName}"`,
          `"${KTAItem.birthCertificateNumber}"`,
          `"WNI"`,
          `"${KTAItem.validityPeriod}"`,
        ].join(",");
      } else {
        const KTPItem = item as KTPGeneratedData;
        return [
          `"=""${KTPItem.nik}"""`,
          `"${KTPItem.name}"`,
          `"=""${KTPItem.birthDate}"""`,
          `"${KTPItem.birthPlace}"`,
          `"${KTPItem.gender}"`,
          `"${KTPItem.address}"`,
          `"${KTPItem.rt}"`,
          `"${KTPItem.rw}"`,
          `"${KTPItem.village}"`,
          `"${KTPItem.district}"`,
          `"${KTPItem.city}"`,
          `"${KTPItem.province}"`,
          `"${KTPItem.religion}"`,
          `"${KTPItem.maritalStatus}"`,
          `"${KTPItem.occupation}"`,
          `"${KTPItem.bloodType}"`,
          `"WNI"`,
          `"SEUMUR HIDUP"`,
        ].join(",");
      }
    }),
  ].join("\n");

  // Create a Blob with the CSV content
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  // Create a temporary link element to trigger the download
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  const fileType = isKTA ? "KTA" : "KTP";

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `Data_${fileType}_${new Date().toISOString().split("T")[0]}.csv`,
  );
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
