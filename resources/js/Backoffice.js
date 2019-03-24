import React, { Component } from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { withWidth, CssBaseline, MuiThemeProvider } from '@material-ui/core';

import { Navigator } from './core';
import { ROUTES } from './config';
import { backofficeTheme as theme } from './themes';
import { Loading } from './views';

class Backoffice extends Component {
    state = {
        loading: true,
        navigating: true,
        authenticated: false,
        auth: {},
        user: {},
        username: '',
    };

    /**
     * Refresh the user's session.
     *
     * @return {undefined}
     */
    refresh = async () => {
        this.setState({ navigating: true });

        try {
            const response = await axios.post('/api/auth/refresh');

            await this.authenticate(JSON.stringify(response.data));

            this.setState({ navigating: false });
        } catch (error) {}
    };

    /**
     * Authenticate the user.
     *
     * @param {string} tokenString
     *
     * @return {undefined}
     */
    authenticate = async (tokenString = null) => {
        const auth = JSON.parse(tokenString);

        // We will set a default Authorization header, this will
        // eliminate the need to include the Authorization header
        // for almost every AJAX requests.
        window.axios.defaults.headers.common['Authorization'] = `Bearer ${
            auth.auth_token
        }`;

        this.setAuthData(auth);

        await this.fetchAuthUser();
    };

    /**
     * Sign out user.
     *
     * @return {undefined}
     */
    signout = async () => {
        this.setState({ loading: true });

        try {
            const response = await axios.post('/api/auth/signout');

            if (response.status === 200) {
                // remove auth data stored in localStorage.
                await localStorage.removeItem('auth');

                this.setState({
                    loading: false,
                    authenticated: false,
                    user: {},
                });
            }
        } catch (error) {}
    };

    /**
     * Sign out the user, but retain the username.
     *
     * @param {string} username
     *
     * @return {undefined}
     */
    handleLock = async username => {
        await this.setState({
            username,
        });

        await this.signout();
    };

    /**
     * Sign out user completely.
     *
     * @return {undefined}
     */
    handleSignout = async () => {
        await this.signout();
    };

    /**
     * Get the Authentication Data from the persistent storage.
     *
     * @return {object}
     */
    getAuthData = () => {
        const authString = window.localStorage.getItem('auth');
        const auth = JSON.parse(authString);

        if (!authString) {
            return {};
        }

        this.setState({ auth });

        return auth;
    };

    /**
     * Store the authentication object as string into a persistent storage.
     *
     * @param {object} data
     *
     * @return {undefined}
     */
    setAuthData = data => {
        // Store it locally for the authentication data to persist.
        window.localStorage.setItem('auth', JSON.stringify(data));
    };

    /**
     * Fetch the authenticated user.
     *
     * @return {undefined}
     */
    fetchAuthUser = async () => {
        try {
            const response = await axios.post('/api/auth/user');

            if (response.status === 200) {
                this.setState({
                    authenticated: true,
                    user: response.data,
                });
            }
        } catch (error) {}
    };

    async componentDidMount() {
        const auth = await this.getAuthData();

        if (auth) {
            await this.authenticate(JSON.stringify(auth));
        }

        this.setState({ loading: false, navigating: false });
    }

    render() {
        const { width } = this.props;
        const { loading } = this.state;

        return (
            <MuiThemeProvider theme={theme}>
                <CssBaseline />

                {loading ? (
                    <Loading />
                ) : (
                    <Router>
                        <Navigator
                            pageProps={{
                                ...this.state,
                                width,
                                environment: 'backoffice',
                                routes: ROUTES,
                                refresh: this.refresh,
                                authenticate: this.authenticate,
                                handleLock: this.handleLock,
                                handleSignout: this.handleSignout,
                            }}
                        />
                    </Router>
                )}
            </MuiThemeProvider>
        );
    }
}

export default withWidth()(Backoffice);
