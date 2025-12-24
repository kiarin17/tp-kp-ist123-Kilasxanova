// TestHelpers/FakeConfiguration.cs
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Primitives;
using System;
using System.Collections.Generic;

namespace TestProject1.TestHelpers
{
    public class FakeConfiguration : IConfiguration
    {
        private readonly Dictionary<string, string> _config;

        public FakeConfiguration(Dictionary<string, string> config = null)
        {
            _config = config ?? new Dictionary<string, string>
            {
                ["Jwt:Key"] = "TestJwtKey123456789012345678901234567890",
                ["Jwt:Issuer"] = "TestIssuer",
                ["Jwt:Audience"] = "TestAudience"
            };
        }

        public string this[string key]
        {
            get => _config.ContainsKey(key) ? _config[key] : null;
            set => _config[key] = value;
        }

        public IEnumerable<IConfigurationSection> GetChildren()
        {
            return new List<IConfigurationSection>();
        }

        public IChangeToken GetReloadToken()
        {
            return new FakeChangeToken();
        }

        public IConfigurationSection GetSection(string key)
        {
            return new FakeConfigurationSection(_config.ContainsKey(key) ? _config[key] : null);
        }

        private class FakeChangeToken : IChangeToken
        {
            public bool HasChanged => false;
            public bool ActiveChangeCallbacks => false;

            public IDisposable RegisterChangeCallback(Action<object> callback, object state)
            {
                return new FakeDisposable();
            }

            private class FakeDisposable : IDisposable
            {
                public void Dispose() { }
            }
        }

        private class FakeConfigurationSection : IConfigurationSection
        {
            private readonly string _value;

            public FakeConfigurationSection(string value)
            {
                _value = value;
            }

            public string this[string key] { get => null; set { } }
            public string Key => null;
            public string Path => null;
            public string Value { get => _value; set { } }

            public IEnumerable<IConfigurationSection> GetChildren()
            {
                return new List<IConfigurationSection>();
            }

            public IChangeToken GetReloadToken()
            {
                return new FakeChangeToken();
            }

            public IConfigurationSection GetSection(string key) => null;
        }
    }
}