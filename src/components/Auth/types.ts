import { I18nVariables, ProviderScopes, ViewType, RedirectTo, OtpType, ViewSignUp, ViewSignIn } from '@supabase/auth-ui-shared'
import { Provider } from '@supabase/supabase-js'

export type AuthProps = {
    providers?: Provider[]
    providerScopes?: Partial<ProviderScopes>
    queryParams?: {
      [key: string]: string;
    }
    view: ViewType
    setView: React.Dispatch<React.SetStateAction<ViewType>>
    redirectTo?: RedirectTo
    onlyThirdPartyProviders?: boolean
    magicLink?: boolean
    showLinks?: boolean
    otpType?: OtpType
    additionalData?: {
      [key: string]: unknown
    }
    // Override the labels and button text
    localization?: {
      variables?: I18nVariables
    }
}

export type EmailAuthProps = {
    authView?: ViewSignIn | ViewSignUp
    defaultEmail?: string
    defaultPassword?: string
    setAuthView?: (view: ViewType) => void
    setDefaultEmail?: (email: string) => void
    setDefaultPassword?: (password: string) => void
    setMessage: (str: string) => void
    showLinks?: boolean
    redirectTo?: RedirectTo
    additionalData?: { [key: string]: unknown }
    magicLink?: boolean
    i18n?: I18nVariables
    children?: React.ReactNode
}

export type ForgottenPasswordProps = {
    setAuthView?: (view: ViewType) => void
    redirectTo?: RedirectTo
    i18n?: I18nVariables
    showLinks?: boolean
    setMessage: (str: string) => void
}

export type MagicLinkProps = {
    setAuthView?: (view: ViewType) => void
    redirectTo?: RedirectTo
    i18n?: I18nVariables
    showLinks?: boolean
    setMessage: (str: string) => void
}

export type SocialAuthProps = {
    providers?: Provider[]
    providerScopes?: Partial<ProviderScopes>
    queryParams?: { [key: string]: string }
    redirectTo?: string | undefined
    onlyThirdPartyProviders?: boolean
    view?: 'sign_in' | 'sign_up' | 'magic_link'
    i18n?: I18nVariables
}

export type UpdatePasswordProps = {
    i18n?: I18nVariables
    setMessage: (str: string) => void
}

export type VerifyOtpProps = {
    setAuthView?: (view: ViewType) => void
    otpType: OtpType
    i18n?: I18nVariables
    showLinks?: boolean
    setMessage: (str: string) => void
}
