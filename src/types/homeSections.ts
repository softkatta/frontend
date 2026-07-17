export type HomeDemoVideo = {
  label: string
  title: string
  highlight: string
  description: string
  video_url: string
  cta_label: string
  cta_href: string
}

export type HomeTechnology = {
  name: string
  description: string
  color: string
}

export type HomeSections = {
  demo_video: HomeDemoVideo
  technologies: HomeTechnology[]
}
