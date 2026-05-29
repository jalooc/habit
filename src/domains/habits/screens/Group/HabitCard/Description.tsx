import { useUnistyles } from 'react-native-unistyles'
import { EnrichedMarkdownText } from 'react-native-enriched-markdown'
import { Linking } from 'react-native'

type Props = {
  description: string,
}

const Description = ({ description }: Props) => {
  const { theme } = useUnistyles()
  
  return (
    <EnrichedMarkdownText
      markdown={description}
      markdownStyle={{
        paragraph: {
          color: theme.colors.textSecondary,
          fontSize: 14,
          lineHeight: 20,
          marginTop: 0,
          marginBottom: 0,
        },
        list: {
          color: theme.colors.textSecondary,
          fontSize: 14,
          lineHeight: 20,
          marginTop: 0,
          marginBottom: 0,
        },
        link: { color: theme.colors.accent, underline: true },
        strong: { color: theme.colors.text },
        em: { color: theme.colors.textSecondary },
        code: { color: theme.colors.textSecondary, backgroundColor: '#F5F5F4' },
      }}
      onLinkPress={({ url }) => void Linking.openURL(url)}
    />
  )
}

export default Description
