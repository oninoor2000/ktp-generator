import type { CardGeneratorActionType, CardType } from "@/lib/types";
import {
  createRootRoute,
  Link,
  Outlet,
  useLocation,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Baby, CreditCard } from "lucide-react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { useImmerReducer } from "use-immer";
import {
  CardGeneratorContext,
  CardGeneratorDispatchContext,
} from "@/context/card-generator-context";
import { NAVIGATION_LINKS } from "@/lib/constant";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/color-mode-toggle";

export const Route = createRootRoute({
  component: Root,
});

const cardGeneratorReducer = (
  card: CardType,
  action: CardGeneratorActionType,
) => {
  switch (action.type) {
    case "SET_CARD_TYPE":
      return action.payload;
    default:
      return card;
  }
};

const isAtHome = (pathname: string) => {
  return pathname === "/";
};

function Root() {
  const { pathname } = useLocation();

  const [card, dispatchCard] = useImmerReducer<
    CardType,
    CardGeneratorActionType
  >(cardGeneratorReducer, isAtHome(pathname) ? "KTP" : "KTA");

  return (
    <>
      <CardGeneratorContext.Provider value={card}>
        <CardGeneratorDispatchContext.Provider value={dispatchCard}>
          <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
            <header className="border-b px-4 md:px-6">
              <div className="flex h-16 items-center justify-between gap-4">
                {/* Left side */}
                <div className="flex items-center gap-2">
                  {/* Mobile menu trigger */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        className="group size-8 md:hidden"
                        variant="ghost"
                        size="icon"
                      >
                        <svg
                          className="pointer-events-none"
                          width={16}
                          height={16}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M4 12L20 12"
                            className="origin-center -translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[315deg]"
                          />
                          <path
                            d="M4 12H20"
                            className="origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
                          />
                          <path
                            d="M4 12H20"
                            className="origin-center translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[135deg]"
                          />
                        </svg>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      className="w-36 p-1 md:hidden"
                    >
                      <NavigationMenu className="max-w-none *:w-full">
                        <NavigationMenuList className="flex-col items-start gap-0 md:gap-2">
                          {NAVIGATION_LINKS.map((link, index) => (
                            <NavigationMenuItem key={index} className="w-full">
                              <Link
                                to={link.href}
                                activeOptions={
                                  link.href === "/"
                                    ? { exact: true }
                                    : undefined
                                }
                                onClick={() =>
                                  dispatchCard({
                                    type: "SET_CARD_TYPE",
                                    payload: link.href === "/" ? "KTP" : "KTA",
                                  })
                                }
                                className="[&.active]:focus:bg-accent [&.active]:hover:bg-accent [&.active]:bg-accent [&.active]:text-accent-foreground hover:bg-accent focus:bg-accent focus:text-accent-foreground focus-visible:ring-ring/50 [&_svg:not([class*='text-'])]:text-muted-foreground flex flex-col gap-1 rounded-sm p-2 text-sm transition-all outline-none focus-visible:ring-[3px] focus-visible:outline-1 [&_svg:not([class*='size-'])]:size-4"
                              >
                                {link.label}
                              </Link>
                            </NavigationMenuItem>
                          ))}
                        </NavigationMenuList>
                      </NavigationMenu>
                    </PopoverContent>
                  </Popover>
                  {/* Main nav */}
                  <div className="flex items-center gap-6">
                    <Link to="/" className="text-primary hover:text-primary/90">
                      <div
                        className={`rounded-xl p-3 ${
                          card === "KTP"
                            ? "bg-gradient-to-r from-cyan-500 to-blue-600"
                            : "bg-gradient-to-r from-pink-500 to-red-500"
                        }`}
                      >
                        {card === "KTP" ? (
                          <CreditCard className="h-5 w-5 text-white" />
                        ) : (
                          <Baby className="h-5 w-5 text-white" />
                        )}
                      </div>
                    </Link>
                    {/* Navigation menu */}
                    <NavigationMenu className="max-md:hidden">
                      <NavigationMenuList className="gap-2">
                        {NAVIGATION_LINKS.map((link, index) => (
                          <NavigationMenuItem key={index}>
                            <Link
                              to={link.href}
                              activeOptions={
                                link.href === "/" ? { exact: true } : undefined
                              }
                              onClick={() =>
                                dispatchCard({
                                  type: "SET_CARD_TYPE",
                                  payload: link.href === "/" ? "KTP" : "KTA",
                                })
                              }
                              className="[&.active]:focus:bg-accent [&.active]:hover:bg-accent [&.active]:bg-accent [&.active]:text-accent-foreground hover:bg-accent focus:bg-accent focus:text-accent-foreground focus-visible:ring-ring/50 [&_svg:not([class*='text-'])]:text-muted-foreground flex flex-col gap-1 rounded-sm p-2 text-sm transition-all outline-none focus-visible:ring-[3px] focus-visible:outline-1 [&_svg:not([class*='size-'])]:size-4"
                            >
                              {link.label}
                            </Link>
                          </NavigationMenuItem>
                        ))}
                      </NavigationMenuList>
                    </NavigationMenu>
                  </div>
                </div>
                {/* Right side */}
                <div className="flex items-center justify-end gap-2">
                  <ModeToggle />

                  <SignedOut>
                    <SignInButton>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="cursor-pointer text-sm"
                      >
                        Sign In
                      </Button>
                    </SignInButton>
                  </SignedOut>
                  <SignedIn>
                    <UserButton />
                  </SignedIn>
                </div>
              </div>
            </header>
            <Outlet />
            <Toaster />
          </ThemeProvider>
          <TanStackRouterDevtools />
        </CardGeneratorDispatchContext.Provider>
      </CardGeneratorContext.Provider>
    </>
  );
}
