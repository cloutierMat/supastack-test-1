import React, { useEffect, useState, PropsWithChildren, FC, useRef } from 'react'
import { I18nVariables, merge, VIEWS, en, ViewType, template } from '@supabase/auth-ui-shared'
import { EmailOtpType, MobileOtpType, Provider, VerifyOtpParams } from '@supabase/supabase-js'
import { useAppContext } from 'contexts'
import {
  AuthProps,
  EmailAuthProps,
  ForgottenPasswordProps,
  MagicLinkProps,
  SocialAuthProps,
  UpdatePasswordProps,
  VerifyOtpProps
} from './types'

export const Auth: FC<PropsWithChildren<AuthProps>> = ({
  providers,
  providerScopes,
  queryParams,
  view = 'sign_in',
  setView,
  redirectTo,
  onlyThirdPartyProviders = false,
  magicLink = false,
  showLinks = true,
  localization = { variables: {} },
  otpType = 'email',
  additionalData,
  children,
}) => {
  const [defaultEmail, setDefaultEmail] = useState('')
  const [defaultPassword, setDefaultPassword] = useState('')
  const [message, setMessage] = useState('')
  const { supabase, error } = useAppContext()
  // Localization support
  const i18n: I18nVariables = merge(en, localization.variables ?? {})

  const isSignView = (
    view === 'sign_in' ||
    view === 'sign_up' ||
    view === 'magic_link'
  )

  useEffect(() => {
    // Overrides the authview if it is changed externally
    const listener = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setView('update_password')
      } else if (event === 'USER_UPDATED' || event === 'SIGNED_OUT') {
        setView('sign_in')
      }
    })
    
    return () => listener.data.subscription.unsubscribe()
  }, [supabase.auth, setView])

  let ViewUI: JSX.Element

  switch (view) {
    case VIEWS.SIGN_IN:
      ViewUI = (
        <EmailAuth
          setAuthView={setView}
          defaultEmail={defaultEmail}
          defaultPassword={defaultPassword}
          setDefaultEmail={setDefaultEmail}
          setDefaultPassword={setDefaultPassword}
          setMessage={setMessage}
          redirectTo={redirectTo}
          magicLink={magicLink}
          showLinks={showLinks}
          i18n={i18n}
          authView='sign_in'
        />
      )
      break
    case VIEWS.SIGN_UP:
      ViewUI = (
        <EmailAuth
          setAuthView={setView}
          defaultEmail={defaultEmail}
          defaultPassword={defaultPassword}
          setDefaultEmail={setDefaultEmail}
          setDefaultPassword={setDefaultPassword}
          setMessage={setMessage}
          redirectTo={redirectTo}
          magicLink={magicLink}
          showLinks={showLinks}
          i18n={i18n}
          authView='sign_up'
          additionalData={additionalData}
        >
          {children}
        </EmailAuth>
      )
      break
    case VIEWS.FORGOTTEN_PASSWORD:
      ViewUI = (
        <ForgottenPassword
          setAuthView={setView}
          setMessage={setMessage}
          redirectTo={redirectTo}
          showLinks={showLinks}
          i18n={i18n}
        />
      )
      break
    case VIEWS.MAGIC_LINK:
      ViewUI = (
        <MagicLink
          setAuthView={setView}
          setMessage={setMessage}
          redirectTo={redirectTo}
          showLinks={showLinks}
          i18n={i18n}
        />
      )
      break
    case VIEWS.UPDATE_PASSWORD:
      ViewUI = (
        <UpdatePassword
          setMessage={setMessage}
          i18n={i18n}
        />
      )
      break
    case VIEWS.VERIFY_OTP:
      ViewUI = (
        <VerifyOtp
          setMessage={setMessage}
          otpType={otpType}
          i18n={i18n}
        />
      )
      break
    default:
      return null
  }

  return (
    <>
      {isSignView && (
        <SocialAuth
          providers={providers}
          providerScopes={providerScopes}
          queryParams={queryParams}
          redirectTo={redirectTo}
          onlyThirdPartyProviders={onlyThirdPartyProviders}
          i18n={i18n}
          view={view}
        />
      )}
      {!onlyThirdPartyProviders && (
        <>
          {ViewUI}
          {message && (
            <span className="block text-center text-xs mb-1 rounded-md py-6 px-4 border-[1px] border-black">
              {message}
            </span>
          )}
          {error && (
            <span className="block text-center text-xs mb-1 rounded-md py-6 px-4 border-[1px] text-red-900 bg-red-100 border-red-950">
              {error.message}
            </span>
          )}
        </>
      )}
    </>
  )
}

export const EmailAuth: FC<PropsWithChildren<EmailAuthProps>> = ({
  authView = 'sign_in',
  defaultEmail = '',
  defaultPassword = '',
  setAuthView = () => {},
  setDefaultEmail = () => {},
  setDefaultPassword = () => {},
  setMessage,
  showLinks = false,
  redirectTo,
  additionalData,
  magicLink,
  i18n,
  children,
}) => {
  const isMounted = useRef<boolean>(true)
  const [email, setEmail] = useState(defaultEmail)
  const [password, setPassword] = useState(defaultPassword)
  const [loading, setLoading] = useState(false)
  const { supabase, withCaptureAuthError } = useAppContext()
  const labels = i18n?.[authView]

  const handleViewChange = (newView: ViewType) => {
    setDefaultEmail(email)
    setDefaultPassword(password)
    setAuthView(newView)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    if (authView === 'sign_in') {
      await withCaptureAuthError(() => supabase.auth.signInWithPassword({
        email,
        password,
      }))
    }

    if (authView === 'sign_up') {
      const { data: { user, session }} = await withCaptureAuthError(() => supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: additionalData
        }
      }))
      
      // Check if session is null -> email confirmation setting is turned on
      if (user && !session) setMessage(i18n?.sign_up?.confirmation_text as string)
    }

    if (isMounted.current) setLoading(false)
  }

  useEffect(() => {
    isMounted.current = true
    return () => {isMounted.current = false}
  }, [])

  return (
    <form
      id={authView === 'sign_in' ? 'auth-sign-in' : 'auth-sign-up'}
      onSubmit={handleSubmit}
      autoComplete='on'
      className="w-full"
    >
      <div className="flex flex-col gap-2 my-2">
        <div className="flex flex-col gap-2 my-2">
          <div>
            <label htmlFor="email" className="text-sm mb-1 text-black block">
              {labels?.email_label}
            </label>
            <input
              className="py-1 px-2 cursor-text border-[1px] border-solid border-black text-s w-full text-black box-border hover:[outline:none] focus:[outline:none]"
              id="email"
              type="email"
              name="email"
              placeholder={labels?.email_input_placeholder}
              defaultValue={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm mb-1 text-black block">
              {labels?.password_label}
            </label>
            <input
              className="py-1 px-2 cursor-text border-[1px] border-solid border-black text-s w-full text-black box-border hover:[outline:none] focus:[outline:none]"
              id="password"
              type="password"
              name="password"
              placeholder={labels?.password_input_placeholder}
              defaultValue={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={authView === 'sign_in' ? 'current-password' : 'new-password'}
            />
          </div>
          {children}
        </div>
        <button
          className="flex justify-center items-center gap-2 rounded-md text-sm p-1 cursor-pointer border-[1px] border-zinc-950 w-full disabled:opacity-70 disabled:cursor-[unset] bg-amber-200 text-amber-950 hover:bg-amber-300"
          type="submit"
          disabled={loading}
        >
          {loading ? labels?.loading_button_label : labels?.button_label}
        </button>
        {showLinks && (
          <div className="flex flex-col gap-2 my-2">
            {authView === VIEWS.SIGN_IN && magicLink && (
              <a
                className="block text-xs text-center mb-1 underline hover:text-blue-700"
                href="#auth-magic-link"
                onClick={(e) => {
                  e.preventDefault()
                  setAuthView(VIEWS.MAGIC_LINK)
                }}
              >
                {i18n?.magic_link?.link_text}
              </a>
            )}
            {authView === VIEWS.SIGN_IN && (
              <a
                className="block text-xs text-center mb-1 underline hover:text-blue-700"
                href="#auth-forgot-password"
                onClick={(e) => {
                  e.preventDefault()
                  setAuthView(VIEWS.FORGOTTEN_PASSWORD)
                }}
              >
                {i18n?.forgotten_password?.link_text}
              </a>
            )}
            {authView === VIEWS.SIGN_IN ? (
              <a
                className="block text-xs text-center mb-1 underline hover:text-blue-700"
                href="#auth-sign-up"
                onClick={(e) => {
                  e.preventDefault()
                  handleViewChange(VIEWS.SIGN_UP)
                }}
              >
                {i18n?.sign_up?.link_text}
              </a>
            ) : (
              <a
                className="block text-xs text-center mb-1 underline hover:text-blue-700"
                href="#auth-sign-in"
                onClick={(e) => {
                  e.preventDefault()
                  handleViewChange(VIEWS.SIGN_IN)
                }}
              >
                {i18n?.sign_in?.link_text}
              </a>
            )}
          </div>
        )}
      </div>
    </form>
  )
}

export const ForgottenPassword: FC<ForgottenPasswordProps> = ({
  setAuthView = () => {},
  redirectTo,
  i18n,
  showLinks = false,
  setMessage
}) => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const { supabase, withCaptureAuthError } = useAppContext()
  const labels = i18n?.forgotten_password

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    const { error } = await withCaptureAuthError(() => supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    }))

    if (!error) setMessage(i18n?.forgotten_password?.confirmation_text as string)
    setLoading(false)
  }

  return (
    <form id="auth-forgot-password" onSubmit={handlePasswordReset}>
      <div className="flex flex-col gap-2 my-2">
        <div>
          <label htmlFor="email" className="text-sm mb-1 text-black block">
            {labels?.email_label}
          </label>
          <input
            className="py-1 px-2 cursor-text border-[1px] border-solid border-black text-s w-full text-black box-border hover:[outline:none] focus:[outline:none]"
            id="email"
            name="email"
            type="email"
            autoFocus
            placeholder={labels?.email_input_placeholder}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button
          className="flex justify-center items-center gap-2 rounded-md text-sm p-1 cursor-pointer border-[1px] border-zinc-950 w-full disabled:opacity-70 disabled:cursor-[unset] bg-amber-200 text-amber-950 hover:bg-amber-300"
          type="submit"
          disabled={loading}
        >
          {loading ? labels?.loading_button_label : labels?.button_label}
        </button>
        {showLinks && (
          <a
            className="block text-xs text-center mb-1 underline hover:text-blue-700"
            href="#auth-sign-in"
            onClick={(e) => {
              e.preventDefault()
              setAuthView(VIEWS.SIGN_IN)
            }}
          >
            {i18n?.sign_in?.link_text}
          </a>
        )}
      </div>
    </form>
  )
}

export const MagicLink: FC<MagicLinkProps> = ({
  setAuthView = () => {},
  redirectTo,
  i18n,
  showLinks = false,
  setMessage
}) => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const { supabase, withCaptureAuthError } = useAppContext()
  const labels = i18n?.magic_link

  const handleMagicLinkSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    const { error } = await withCaptureAuthError(() => supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    }))

    if (!error) setMessage(i18n?.magic_link?.confirmation_text as string)
    setLoading(false)
  }

  return (
    <form id="auth-magic-link" className="flex flex-col gap-2 my-2" onSubmit={handleMagicLinkSignIn}>
      <div>
        <label htmlFor="email" className="text-sm mb-1 text-black block">
          {labels?.email_input_label}
        </label>
        <input
          className="py-1 px-2 cursor-text border-[1px] border-solid border-black text-s w-full text-black box-border hover:[outline:none] focus:[outline:none]"
          id="email"
          name="email"
          type="email"
          autoFocus
          placeholder={labels?.email_input_placeholder}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setEmail(e.target.value)
          }}
        />
      </div>
      <button
        className="flex justify-center items-center gap-2 rounded-md text-sm p-1 cursor-pointer border-[1px] border-zinc-950 w-full disabled:opacity-70 disabled:cursor-[unset] bg-amber-200 text-amber-950 hover:bg-amber-300"
        type="submit"
        disabled={loading}
      >
        {loading ? labels?.loading_button_label : labels?.button_label}
      </button>
      {showLinks && (
        <a
          className="block text-xs text-center mb-1 underline hover:text-blue-700"
          href="#auth-sign-in"
          onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.preventDefault()
            setAuthView(VIEWS.SIGN_IN)
          }}
        >
          {i18n?.sign_in?.link_text}
        </a>
      )}
    </form>
  )
}

export const SocialAuth: FC<SocialAuthProps> = ({
  providers = ['github', 'google', 'facebook'],
  providerScopes,
  queryParams,
  redirectTo,
  onlyThirdPartyProviders = true,
  view = 'sign_in',
  i18n,
}) => {
  const { supabase, withCaptureAuthError } = useAppContext()
  const [loading, setLoading] = useState(false)
  const currentView = view === 'magic_link' ? 'sign_in' : view

  const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.toLowerCase().slice(1)

  const handleProviderSignIn = async (provider: Provider) => {
    setLoading(true)

    await withCaptureAuthError(() => supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        scopes: providerScopes?.[provider],
        queryParams,
      },
    }))

    setLoading(false)
  }

  if (!providers || providers.length === 0) return null

  return (
    <>
      <div className="flex flex-col gap-2 my-2">
        {providers.map((provider: Provider) => (
          <button
            key={provider}
            className="flex justify-center items-center gap-2 rounded-md text-sm p-1 cursor-pointer border-[1px] border-zinc-950 w-full disabled:opacity-70 disabled:cursor-[unset] bg-transparent text-black hover:bg-stone-100"
            disabled={loading}
            onClick={() => handleProviderSignIn(provider)}
          >
            <img src={`/${provider}.svg`} />
            {template(
              i18n?.[currentView]?.social_provider_text as string,
              { provider: capitalize(provider) }
            )}
          </button>
        ))}
      </div>
      {!onlyThirdPartyProviders && <div className="block my-4 h-[1px] w-full" />}
    </>
  )
}

export const UpdatePassword: FC<UpdatePasswordProps> = ({ i18n, setMessage }) => {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { supabase, withCaptureAuthError } = useAppContext()
  const labels = i18n?.update_password

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    const { error } = await withCaptureAuthError(() => supabase.auth.updateUser({ password }))

    if (!error) setMessage(i18n?.update_password?.confirmation_text as string)
    setLoading(false)
  }

  return (
    <form id="auth-update-password" className="flex flex-col gap-2 my-2" onSubmit={handlePasswordReset}>
      <div>
        <label htmlFor="password" className="text-sm mb-1 text-black block">
          {labels?.password_label}
        </label>
        <input
          className="py-1 px-2 cursor-text border-[1px] border-solid border-black text-s w-full text-black box-border hover:[outline:none] focus:[outline:none]"
          id="password"
          name="password"
          placeholder={labels?.password_label}
          type="password"
          autoFocus
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setPassword(e.target.value)
          }
        />
      </div>
      <button
        type="submit"
        className="flex justify-center items-center gap-2 rounded-md text-sm p-1 cursor-pointer border-[1px] border-zinc-950 w-full disabled:opacity-70 disabled:cursor-[unset] bg-amber-200 text-amber-950 hover:bg-amber-300"
        disabled={loading}
      >
        {loading ? labels?.loading_button_label : labels?.button_label}
      </button>
    </form>
  )
}

export const VerifyOtp: FC<VerifyOtpProps> = ({
  setAuthView = () => {},
  otpType = 'email',
  i18n,
  showLinks = false,
  setMessage
}) => {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const { supabase, withCaptureAuthError } = useAppContext()
  const labels = i18n?.verify_otp
  const isPhone = otpType === 'sms' || otpType === 'phone_change'

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    const verifyOpts: VerifyOtpParams = isPhone
      ? { phone, token, type: otpType as MobileOtpType }
      : { email, token, type: otpType as EmailOtpType }

    await withCaptureAuthError(() => supabase.auth.verifyOtp(verifyOpts))
    setLoading(false)
  }

  return (
    <form id="auth-magic-link" className="flex flex-col gap-2 my-2" onSubmit={handleSubmit}>
      <div>
        <label htmlFor={isPhone ? "phone" : "email"} className="text-sm mb-1 text-black block">
          {isPhone ? labels?.phone_input_label : labels?.email_input_label}
        </label>
        <input
          className="py-1 px-2 cursor-text border-[1px] border-solid border-black text-s w-full text-black box-border hover:[outline:none] focus:[outline:none]"
          id={isPhone ? "phone" : "email"}
          name={isPhone ? "phone" : "email"}
          type={isPhone ? "text" : "email"}
          autoFocus
          placeholder={isPhone ? labels?.phone_input_placeholder : labels?.email_input_placeholder}
          onChange={(e) => (isPhone ? setPhone : setEmail)(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="token" className="text-sm mb-1 text-black block">
          {labels?.token_input_label}
        </label>
        <input
          className="py-1 px-2 cursor-text border-[1px] border-solid border-black text-s w-full text-black box-border hover:[outline:none] focus:[outline:none]"
          id="token"
          name="token"
          type="text"
          placeholder={labels?.token_input_placeholder}
          onChange={(e) => setToken(e.target.value)}
        />
      </div>
      <button
        className="flex justify-center items-center gap-2 rounded-md text-sm p-1 cursor-pointer border-[1px] border-zinc-950 w-full disabled:opacity-70 disabled:cursor-[unset] bg-amber-200 text-amber-950 hover:bg-amber-300"
        type="submit"
        disabled={loading}
      >
        {loading ? labels?.loading_button_label : labels?.button_label}
      </button>
      {showLinks && (
        <a
          className="block text-xs text-center mb-1 underline hover:text-blue-700"
          href="#auth-sign-in"
          onClick={(e) => {
            e.preventDefault()
            setAuthView(VIEWS.SIGN_IN)
          }}
        >
          {i18n?.sign_in?.link_text}
        </a>
      )}
    </form>
  )
}
