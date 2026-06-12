export const seo = ({
  title,
  description,
  keywords,
  image,
}: {
  title: string
  description?: string
  image?: string
  keywords?: string
}) => {
  const tags = [
    { title },
    { name: 'description', content: description },
    { name: 'keywords', content: keywords },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:card', content: image ? 'summary_large_image' : 'summary' },
    { property: 'og:type', content: 'website' },
    { property: 'og:locale', content: 'id_ID' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    ...(image
      ? [
          { name: 'twitter:image', content: image },
          { property: 'og:image', content: image },
        ]
      : []),
  ]

  return tags.filter((tag) => !('content' in tag) || tag.content)
}
